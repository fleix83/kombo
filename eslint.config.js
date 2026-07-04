import tseslint from 'typescript-eslint'

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    // Portability boundary (PRD §6.1): src/core must stay platform-neutral.
    // No browser globals, no react-dom, no router, no ui/pages imports.
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'core/ is platform-neutral (PRD §6.1)' },
        { name: 'document', message: 'core/ is platform-neutral (PRD §6.1)' },
        { name: 'navigator', message: 'core/ is platform-neutral (PRD §6.1)' },
        { name: 'localStorage', message: 'core/ is platform-neutral (PRD §6.1)' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react-dom', 'react-dom/*'], message: 'core/ is platform-neutral (PRD §6.1)' },
            { group: ['react-router*'], message: 'core/ is platform-neutral (PRD §6.1)' },
            { group: ['**/ui/*', '**/pages/*'], message: 'core/ must not import ui/pages (PRD §6.1)' },
          ],
        },
      ],
    },
  },
)
