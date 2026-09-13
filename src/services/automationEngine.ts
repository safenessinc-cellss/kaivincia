import { 
  Area, 
  EventKey, 
  Condition, 
  Action, 
  AutomationRule, 
  AutomationLog,
  AutomationLogActionExecution 
} from '../types/automation';
import { ACTIONS_CATALOG } from '../config/automationCatalog';
import { integrationService } from './integrationService';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';

export interface RuleExecutionResult {
  ruleId: string;
  ruleName: string;
  status: 'completed' | 'partial' | 'failed' | 'no_match';
  message: string;
  executedActions: AutomationLogActionExecution[];
}

/**
 * Evalúa las condiciones configuradas con lógica combinada AND / OR.
 * No genera efectos secundarios (ideal para simulaciones dry-run y ejecución real).
 */
export function evaluateRuleConditions(
  conditions: Condition[],
  payload: Record<string, any>
): {
  matched: boolean;
  details: {
    conditionId: string;
    field: string;
    operator: string;
    expected: any;
    actual: any;
    passed: boolean;
  }[];
} {
  if (!conditions || conditions.length === 0) {
    return { matched: true, details: [] };
  }

  const details: {
    conditionId: string;
    field: string;
    operator: string;
    expected: any;
    actual: any;
    passed: boolean;
  }[] = [];

  // Evaluación secuencial con acumulador lógico AND / OR
  let overallResult = true;

  for (let i = 0; i < conditions.length; i++) {
    const cond = conditions[i];
    const actualVal = payload[cond.field];
    const expectedVal = cond.value;

    let passed = false;

    switch (cond.operator) {
      case 'equals':
        passed = String(actualVal ?? '').toLowerCase().trim() === String(expectedVal ?? '').toLowerCase().trim();
        break;
      case 'not_equals':
        passed = String(actualVal ?? '').toLowerCase().trim() !== String(expectedVal ?? '').toLowerCase().trim();
        break;
      case 'contains':
        passed = String(actualVal ?? '')
          .toLowerCase()
          .includes(String(expectedVal ?? '').toLowerCase().trim());
        break;
      case 'not_contains':
        passed = !String(actualVal ?? '')
          .toLowerCase()
          .includes(String(expectedVal ?? '').toLowerCase().trim());
        break;
      case 'greater_than':
        passed = Number(actualVal) > Number(expectedVal);
        break;
      case 'less_than':
        passed = Number(actualVal) < Number(expectedVal);
        break;
      case 'greater_or_equal':
        passed = Number(actualVal) >= Number(expectedVal);
        break;
      case 'less_or_equal':
        passed = Number(actualVal) <= Number(expectedVal);
        break;
      case 'is_empty':
        passed = actualVal === undefined || actualVal === null || String(actualVal).trim() === '';
        break;
      case 'is_not_empty':
        passed = actualVal !== undefined && actualVal !== null && String(actualVal).trim() !== '';
        break;
      case 'in': {
        const list = Array.isArray(expectedVal)
          ? expectedVal.map((s) => String(s).trim().toLowerCase())
          : String(expectedVal ?? '')
              .split(',')
              .map((s) => s.trim().toLowerCase());
        passed = list.includes(String(actualVal ?? '').toLowerCase().trim());
        break;
      }
      case 'not_in': {
        const list = Array.isArray(expectedVal)
          ? expectedVal.map((s) => String(s).trim().toLowerCase())
          : String(expectedVal ?? '')
              .split(',')
              .map((s) => s.trim().toLowerCase());
        passed = !list.includes(String(actualVal ?? '').toLowerCase().trim());
        break;
      }
      default:
        passed = false;
    }

    details.push({
      conditionId: cond.id,
      field: cond.field,
      operator: cond.operator,
      expected: expectedVal,
      actual: actualVal,
      passed
    });

    if (i === 0) {
      overallResult = passed;
    } else {
      if (cond.logic === 'OR') {
        overallResult = overallResult || passed;
      } else {
        overallResult = overallResult && passed;
      }
    }
  }

  return { matched: overallResult, details };
}

/**
 * Ejecutor en Cascada de una Regla sobre un Payload real.
 * Si alguna acción falla, dispara su Fallback configurado.
 * Registra auditoría exhaustiva en la colección `automation_logs`.
 */
export async function executeAutomationRule(
  rule: AutomationRule,
  payload: Record<string, any>,
  triggeredBy: string = 'system'
): Promise<RuleExecutionResult> {
  const startTime = Date.now();

  // 1. Validar si la regla está activa
  if (!rule.isActive) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status: 'no_match',
      message: 'Regla pausada o inactiva.',
      executedActions: []
    };
  }

  // 2. Evaluar condiciones
  const { matched, details } = evaluateRuleConditions(rule.conditions, payload);

  if (!matched) {
    // Registrar log de no coincidencia
    await logExecution({
      ruleId: rule.id,
      ruleName: rule.name,
      area: rule.area,
      event: rule.event,
      payload,
      conditionsMatched: false,
      actionsExecuted: [],
      errors: ['Condiciones no cumplidas'],
      retries: 0,
      status: 'no_match'
    });

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status: 'no_match',
      message: 'El evento no cumple las condiciones configuradas.',
      executedActions: []
    };
  }

  // 3. Ejecutar acciones ordenadas
  const sortedActions = [...rule.actions]
    .filter((a) => a.isEnabled)
    .sort((a, b) => a.order - b.order);

  const executedActions: AutomationLogActionExecution[] = [];
  const errorsList: string[] = [];
  let failuresCount = 0;

  for (const action of sortedActions) {
    try {
      const result = await integrationService.dispatchAction(
        action.type,
        action.params,
        payload,
        action.responsibleRole
      );

      if (result.success) {
        executedActions.push({
          actionId: action.id,
          actionType: action.type,
          status: 'success',
          message: result.data?.message || 'Acción completada con éxito',
          timestamp: new Date().toISOString()
        });
      } else {
        failuresCount++;
        const errorMsg = result.error || 'Error al ejecutar acción';
        errorsList.push(errorMsg);

        // Disparar Fallback si existe
        if (action.fallback) {
          try {
            await integrationService.dispatchAction(
              action.fallback.type,
              action.fallback.params,
              { originalPayload: payload, error: errorMsg },
              action.fallback.responsibleRole
            );
            executedActions.push({
              actionId: action.id,
              actionType: action.type,
              status: 'fallback_triggered',
              message: `Fallo original: ${errorMsg}. Fallback ${action.fallback.type} ejecutado`,
              timestamp: new Date().toISOString()
            });
          } catch (fbErr: any) {
            executedActions.push({
              actionId: action.id,
              actionType: action.type,
              status: 'failed',
              message: `Fallo original y fallback: ${fbErr?.message || 'Error en fallback'}`,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          executedActions.push({
            actionId: action.id,
            actionType: action.type,
            status: 'failed',
            message: errorMsg,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err: any) {
      failuresCount++;
      const exMsg = err?.message || 'Excepción no controlada en acción';
      errorsList.push(exMsg);

      executedActions.push({
        actionId: action.id,
        actionType: action.type,
        status: 'failed',
        message: exMsg,
        timestamp: new Date().toISOString()
      });
    }
  }

  const finalStatus: 'completed' | 'partial' | 'failed' = 
    failuresCount === 0
      ? 'completed'
      : failuresCount === sortedActions.length
      ? 'failed'
      : 'partial';

  // 4. Actualizar contadores en la regla de Firestore
  try {
    const ruleRef = doc(db, 'automation_rules', rule.id);
    await updateDoc(ruleRef, {
      executionCount: increment(1),
      ...(finalStatus === 'failed' ? { failureCount: increment(1) } : {}),
      lastRunAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[AutomationEngine] No se pudo actualizar contadores de regla:', err);
  }

  // 5. Guardar Log de Ejecución
  await logExecution({
    ruleId: rule.id,
    ruleName: rule.name,
    area: rule.area,
    event: rule.event,
    payload,
    conditionsMatched: true,
    actionsExecuted: executedActions,
    errors: errorsList.length > 0 ? errorsList : undefined,
    retries: 0,
    status: finalStatus
  });

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    status: finalStatus,
    message: finalStatus === 'completed' ? 'Regla ejecutada con éxito' : `Finalizado con estado: ${finalStatus}`,
    executedActions
  };
}

/**
 * Registra el log en la colección `automation_logs` de Firestore
 */
async function logExecution(logData: Omit<AutomationLog, 'id' | 'timestamp'>) {
  try {
    await addDoc(collection(db, 'automation_logs'), {
      ...logData,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error('[AutomationEngine] Error al persistir log de auditoría:', err);
  }
}
