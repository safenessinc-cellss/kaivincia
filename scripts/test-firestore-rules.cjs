const fs = require('node:fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, collection, query, where, updateDoc, deleteDoc } = require('firebase/firestore');

const projectId = 'demo-kaivincia-security';
const rules = fs.readFileSync('firestore.rules', 'utf8');

async function main() {
  const env = await initializeTestEnvironment({ projectId, firestore: { rules } });
  try {
    await env.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      const profiles = [
        ['alice', { role: 'agent', status: 'approved' }],
        ['bob', { role: 'agent', status: 'approved' }],
        ['pending', { role: 'agent', status: 'pending' }],
        ['hr', { role: 'rrhh', status: 'approved' }],
        ['hr-denied', { role: 'rrhh', status: 'approved', permissions: { recruitment_payroll: false } }],
        ['agent-hr-override', { role: 'agent', status: 'approved', permissions: { recruitment_payroll: true } }],
        ['admin', { role: 'admin', status: 'approved' }],
        ['superadmin', { role: 'superadmin', status: 'approved' }],
        ['admin-no-telephony', { role: 'admin', status: 'approved', permissions: { telephony_config: false } }],
        ['agent-no-voip', { role: 'agent', status: 'approved', permissions: { voip_calls: false } }],
        ['manager', { role: 'ceo', status: 'approved' }]
      ];
      for (const [uid, profile] of profiles) await setDoc(doc(db, 'users', uid), profile);
      await setDoc(doc(db, 'settings', 'rbac_matrix'), {
        matrix: { rrhh: { recruitment_payroll: true }, agent: { recruitment_payroll: false } }
      });
      await setDoc(doc(db, 'company_profiles', 'alice'), { ownerUid: 'alice', email: 'alice@example.test', status: 'pending' });
      await setDoc(doc(db, 'clients', 'alice-client'), { name: 'Alice Client', createdBy: 'alice', assignedTo: 'alice' });
      await setDoc(doc(db, 'clients', 'bob-client'), { name: 'Bob Client', createdBy: 'bob', assignedTo: 'bob' });
      await setDoc(doc(db, 'clients', 'alice-client', 'notes', 'note-1'), { text: 'private note' });
      await setDoc(doc(db, 'tasks', 'alice-task'), { title: 'Alice task', createdBy: 'alice', assignedTo: 'alice' });
      await setDoc(doc(db, 'omnichannel_threads', 'alice-thread'), { ownerId: 'alice', createdBy: 'alice', assignedTo: 'alice', name: 'Alice conversation' });
      await setDoc(doc(db, 'chat_messages', 'private-message'), { type: 'private', senderId: 'alice', targetId: 'bob', text: 'private' });
      await setDoc(doc(db, 'chat_messages', 'general-message'), { type: 'groups', targetId: 'general', senderId: 'alice', text: 'general' });
      await setDoc(doc(db, 'chat_messages', 'devops-message'), { type: 'groups', targetId: 'dev-ops', senderId: 'admin', text: 'internal' });
      await setDoc(doc(db, 'telnyx_sip_credentials', 'alice-sip'), { assignedTo: 'alice', secret: 'test-only' });
      await setDoc(doc(db, 'voip_call_history', 'alice-call'), { agentId: 'alice', contactPhone: '+15555550100' });
      await setDoc(doc(db, 'esim_profiles', 'admin-esim'), { isDemo: false, phone: '+15555550101' });
      await setDoc(doc(db, 'telnyx_phone_numbers', 'admin-number'), { phoneNumber: '+15555550102' });
      await setDoc(doc(db, 'telnyx_agent_assignments', 'alice'), { agentId: 'alice', authorizedNumbers: ['+15555550102'] });
      await setDoc(doc(db, 'voip_providers', 'telnyx'), { name: 'Telnyx', apiKey: 'test-only' });
      await setDoc(doc(db, 'settings', 'telnyx_config'), { login_token: 'test-only-jwt' });
      await setDoc(doc(db, 'support_tickets', 'alice-ticket'), {
        userId: 'alice', userEmail: 'alice@example.test', subject: 'Login issue',
        description: 'Cannot log in', priority: 'medium', status: 'open',
        assignedTo: null, assignedToEmail: null, messages: [], createdAt: '2026-11-01'
      });
      await setDoc(doc(db, 'support_tickets', 'bob-ticket'), {
        userId: 'bob', userEmail: 'bob@example.test', subject: 'Billing issue',
        description: 'Need invoice', priority: 'low', status: 'open',
        assignedTo: null, assignedToEmail: null, messages: [], createdAt: '2026-11-01'
      });
      await setDoc(doc(db, 'candidates', 'candidate-1'), { name: 'Candidate One', email: 'candidate@example.test', status: 'Nuevo' });
      await setDoc(doc(db, 'jobs', 'job-1'), { title: 'HR Analyst', department: 'People', status: 'active' });
      await setDoc(doc(db, 'attendance_logs', 'alice-attendance'), { userId: 'alice', type: 'in', timestamp: '2026-11-01T09:00:00Z' });
      await setDoc(doc(db, 'absence_requests', 'alice-absence'), { userId: 'alice', status: 'pending', reason: 'Personal', startDate: '2026-11-02', endDate: '2026-11-02' });
    });

    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();
    const pending = env.authenticatedContext('pending').firestore();
    const hr = env.authenticatedContext('hr').firestore();
    const hrDenied = env.authenticatedContext('hr-denied').firestore();
    const agentHrOverride = env.authenticatedContext('agent-hr-override').firestore();
    const admin = env.authenticatedContext('admin').firestore();
    const superadmin = env.authenticatedContext('superadmin').firestore();
    const accountOwner = env.authenticatedContext('account-owner', { email: 'safeness.c.a@gmail.com' }).firestore();
    const adminNoTelephony = env.authenticatedContext('admin-no-telephony').firestore();
    const agentNoVoip = env.authenticatedContext('agent-no-voip').firestore();
    const manager = env.authenticatedContext('manager').firestore();
    const anonymous = env.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(anonymous, 'company_profiles', 'alice')));
    await assertFails(getDoc(doc(alice, 'company_profiles', 'alice')));
    await assertSucceeds(getDoc(doc(admin, 'company_profiles', 'alice')));
    await assertFails(setDoc(doc(anonymous, 'company_profiles', 'public-profile'), { name: 'Public' }));
    await assertSucceeds(getDoc(doc(alice, 'clients', 'alice-client')));
    await assertSucceeds(setDoc(doc(alice, 'clients', 'alice-new-client'), { name: 'New client', createdBy: 'alice' }));
    await assertFails(setDoc(doc(bob, 'clients', 'forged-client'), { name: 'Forged', createdBy: 'alice' }));
    await assertFails(setDoc(doc(alice, 'clients', 'shared-client'), { name: 'Shared', createdBy: 'alice', assignedTo: 'bob' }));
    await assertSucceeds(setDoc(doc(admin, 'clients', 'admin-assigned-client'), { name: 'Admin assigned', createdBy: 'admin', assignedTo: 'bob' }));
    await assertFails(setDoc(doc(pending, 'tasks', 'pending-task'), { title: 'Pending', createdBy: 'pending', assignedTo: 'pending' }));
    await assertFails(setDoc(doc(alice, 'tasks', 'shared-task'), { title: 'Shared', createdBy: 'alice', assignedTo: 'bob' }));
    await assertSucceeds(setDoc(doc(admin, 'tasks', 'admin-assigned-task'), { title: 'Admin assigned', createdBy: 'admin', assignedTo: 'bob' }));
    await assertFails(updateDoc(doc(alice, 'tasks', 'alice-task'), { assignedTo: 'bob' }));
    await assertFails(getDoc(doc(alice, 'clients', 'bob-client')));
    await assertFails(updateDoc(doc(alice, 'clients', 'alice-client'), { assignedTo: 'bob' }));
    await assertFails(updateDoc(doc(alice, 'clients', 'alice-client'), { assignedManagerId: 'bob' }));
    await assertSucceeds(updateDoc(doc(admin, 'clients', 'alice-client'), { assignedTo: 'bob' }));
    await assertSucceeds(getDocs(query(collection(alice, 'clients'), where('createdBy', '==', 'alice'))));
    await assertFails(getDocs(collection(alice, 'clients')));
    await assertSucceeds(getDoc(doc(alice, 'tasks', 'alice-task')));
    await assertFails(getDoc(doc(bob, 'tasks', 'alice-task')));
    await assertSucceeds(getDoc(doc(alice, 'omnichannel_threads', 'alice-thread')));
    await assertFails(getDoc(doc(bob, 'omnichannel_threads', 'alice-thread')));
    await assertFails(updateDoc(doc(alice, 'omnichannel_threads', 'alice-thread'), { assignedTo: 'bob' }));
    await assertFails(setDoc(doc(alice, 'omnichannel_threads', 'shared-thread'), { ownerId: 'alice', createdBy: 'alice', assignedTo: 'bob' }));
    await assertSucceeds(setDoc(doc(alice, 'omnichannel_threads', 'alice-new-thread'), { ownerId: 'alice', createdBy: 'alice', assignedTo: 'alice' }));
    await assertSucceeds(setDoc(doc(alice, 'omnichannel_threads', 'alice-thread', 'messages', 'own-message'), { senderId: 'alice', text: 'own' }));
    await assertFails(setDoc(doc(alice, 'omnichannel_threads', 'alice-thread', 'messages', 'forged-message'), { senderId: 'bob', text: 'forged' }));
    await assertFails(getDoc(doc(pending, 'clients', 'alice-client')));
    await assertFails(getDoc(doc(pending, 'clients', 'alice-client', 'notes', 'note-1')));

    await assertSucceeds(getDoc(doc(alice, 'chat_messages', 'private-message')));
    await assertSucceeds(getDoc(doc(bob, 'chat_messages', 'private-message')));
    await assertSucceeds(getDoc(doc(alice, 'chat_messages', 'general-message')));
    await assertFails(getDoc(doc(alice, 'chat_messages', 'devops-message')));
    await assertFails(setDoc(doc(alice, 'chat_messages', 'devops-forged'), { type: 'groups', targetId: 'dev-ops', senderId: 'alice' }));
    await assertSucceeds(setDoc(doc(alice, 'chat_messages', 'general-new'), { type: 'groups', targetId: 'general', senderId: 'alice' }));
    await assertSucceeds(getDoc(doc(admin, 'chat_messages', 'devops-message')));

    await assertFails(getDoc(doc(alice, 'telnyx_sip_credentials', 'alice-sip')));
    await assertFails(getDoc(doc(manager, 'telnyx_sip_credentials', 'alice-sip')));
    await assertFails(getDoc(doc(adminNoTelephony, 'telnyx_sip_credentials', 'alice-sip')));
    await assertSucceeds(getDoc(doc(admin, 'telnyx_sip_credentials', 'alice-sip')));
    await assertFails(setDoc(doc(bob, 'chat_messages', 'forged-private'), { type: 'private', senderId: 'alice', targetId: 'bob' }));
    await assertFails(getDoc(doc(bob, 'telnyx_sip_credentials', 'alice-sip')));
    await assertSucceeds(getDoc(doc(alice, 'voip_call_history', 'alice-call')));
    await assertSucceeds(getDoc(doc(manager, 'voip_call_history', 'alice-call')));
    await assertFails(getDoc(doc(manager, 'voip_providers', 'telnyx')));
    await assertFails(getDoc(doc(manager, 'settings', 'telnyx_config')));
    await assertFails(getDoc(doc(adminNoTelephony, 'settings', 'telnyx_config')));
    await assertFails(getDoc(doc(agentNoVoip, 'voip_call_history', 'alice-call')));
    await assertSucceeds(getDoc(doc(admin, 'voip_providers', 'telnyx')));
    await assertSucceeds(getDoc(doc(admin, 'settings', 'telnyx_config')));
    await assertFails(updateDoc(doc(alice, 'voip_call_history', 'alice-call'), { contactPhone: '+15555550999' }));
    await assertFails(updateDoc(doc(manager, 'voip_call_history', 'alice-call'), { contactPhone: '+15555550999' }));
    await assertSucceeds(updateDoc(doc(admin, 'voip_call_history', 'alice-call'), { contactPhone: '+15555550999' }));
    await assertFails(getDoc(doc(bob, 'voip_call_history', 'alice-call')));
    await assertSucceeds(getDoc(doc(alice, 'telnyx_agent_assignments', 'alice')));
    await assertFails(getDoc(doc(agentNoVoip, 'telnyx_agent_assignments', 'alice')));
    await assertFails(getDoc(doc(bob, 'telnyx_agent_assignments', 'alice')));
    await assertFails(getDoc(doc(alice, 'esim_profiles', 'admin-esim')));
    await assertSucceeds(getDoc(doc(admin, 'esim_profiles', 'admin-esim')));
    await assertFails(getDoc(doc(alice, 'telnyx_phone_numbers', 'admin-number')));
    await assertSucceeds(getDoc(doc(admin, 'telnyx_phone_numbers', 'admin-number')));
    // Helpdesk lifecycle: customers can reply only on their own open ticket;
    // they cannot close, reprioritize or reassign it.
    await assertSucceeds(getDoc(doc(alice, 'support_tickets', 'alice-ticket')));
    await assertFails(getDoc(doc(alice, 'support_tickets', 'bob-ticket')));
    await assertFails(updateDoc(doc(alice, 'support_tickets', 'alice-ticket'), { status: 'closed', updatedAt: 'now' }));
    await assertFails(updateDoc(doc(alice, 'support_tickets', 'alice-ticket'), { priority: 'critical', updatedAt: 'now' }));
    await assertFails(updateDoc(doc(alice, 'support_tickets', 'alice-ticket'), { assignedTo: 'bob', updatedAt: 'now' }));
    await assertSucceeds(updateDoc(doc(alice, 'support_tickets', 'alice-ticket'), {
      messages: [{ senderId: 'alice', text: 'Additional details' }], updatedAt: 'now'
    }));
    await assertSucceeds(updateDoc(doc(admin, 'support_tickets', 'alice-ticket'), { status: 'in_progress' }));

    // HR can read and manage recruitment/attendance data, but cannot grant
    // application roles, permissions or account approval.
    await assertSucceeds(getDoc(doc(hr, 'users', 'alice')));
    await assertFails(updateDoc(doc(hr, 'users', 'alice'), { role: 'admin' }));
    await assertFails(updateDoc(doc(hr, 'users', 'alice'), { status: 'active' }));
    await assertFails(updateDoc(doc(admin, 'users', 'bob'), { role: 'admin' }));
    await assertFails(setDoc(doc(admin, 'users', 'new-user'), { role: 'agent', status: 'pending' }));
    await assertSucceeds(updateDoc(doc(superadmin, 'users', 'bob'), { role: 'admin' }));
    await assertFails(updateDoc(doc(admin, 'settings', 'rbac_matrix'), { matrix: {} }));
    await assertSucceeds(updateDoc(doc(superadmin, 'settings', 'rbac_matrix'), { updatedBy: 'superadmin' }));
    await assertSucceeds(getDoc(doc(hr, 'candidates', 'candidate-1')));
    await assertFails(getDoc(doc(hrDenied, 'candidates', 'candidate-1')));
    await assertSucceeds(getDoc(doc(agentHrOverride, 'candidates', 'candidate-1')));
    await assertSucceeds(updateDoc(doc(hr, 'candidates', 'candidate-1'), { status: 'Entrevista', hrNotes: 'Revisión inicial completada.' }));
    await assertFails(updateDoc(doc(hr, 'candidates', 'candidate-1'), { hrNotes: 'x'.repeat(5001) }));
    await assertSucceeds(updateDoc(doc(hr, 'jobs', 'job-1'), { status: 'closed' }));
    await assertSucceeds(getDoc(doc(hr, 'attendance_logs', 'alice-attendance')));
    await assertSucceeds(updateDoc(doc(hr, 'attendance_logs', 'alice-attendance'), { type: 'out' }));
    await assertSucceeds(getDoc(doc(hr, 'absence_requests', 'alice-absence')));
    await assertSucceeds(updateDoc(doc(hr, 'absence_requests', 'alice-absence'), { status: 'approved' }));
    await assertFails(getDoc(doc(hr, 'audit_logs', 'private-audit')));

    await assertSucceeds(getDocs(collection(admin, 'clients')));

    // Only the explicitly designated owner account may delete a CRM user profile.
    await assertFails(deleteDoc(doc(admin, 'users', 'alice')));
    await assertFails(deleteDoc(doc(manager, 'users', 'bob')));
    await assertSucceeds(deleteDoc(doc(accountOwner, 'users', 'alice')));

    console.log('Firestore security tests passed: ownership, scoped queries, pending accounts, private chat, group channel roles and SIP assignment.');
  } finally {
    await env.cleanup();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
