import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'api/**',
      'server/**',
      'scripts/**',
      '*.config.*',
      'vite.config.ts',
      '_backup_pre_hardening/**',
      '_backup_hardening/**',
      'dump_blocks/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Errores de lógica → error
      'react-hooks/rules-of-hooks': 'error',
      // Estilo y deuda técnica → warn (no bloquean commit)
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-empty': 'warn',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-useless-escape': 'warn',
    },
  }
);
