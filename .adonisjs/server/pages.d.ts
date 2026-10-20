import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'admin/catalog/index': ExtractProps<(typeof import('../../inertia/pages/admin/catalog/index.tsx'))['default']>
    'admin/hub': ExtractProps<(typeof import('../../inertia/pages/admin/hub.tsx'))['default']>
    'admin/staff/index': ExtractProps<(typeof import('../../inertia/pages/admin/staff/index.tsx'))['default']>
    'admin/tables/index': ExtractProps<(typeof import('../../inertia/pages/admin/tables/index.tsx'))['default']>
    'admin/tables/print': ExtractProps<(typeof import('../../inertia/pages/admin/tables/print.tsx'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'auth/signup': ExtractProps<(typeof import('../../inertia/pages/auth/signup.tsx'))['default']>
    'cashier/hub': ExtractProps<(typeof import('../../inertia/pages/cashier/hub.tsx'))['default']>
    'client/menu': ExtractProps<(typeof import('../../inertia/pages/client/menu.tsx'))['default']>
    'client/statement': ExtractProps<(typeof import('../../inertia/pages/client/statement.tsx'))['default']>
    'client/welcome': ExtractProps<(typeof import('../../inertia/pages/client/welcome.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'manager/hub': ExtractProps<(typeof import('../../inertia/pages/manager/hub.tsx'))['default']>
    'staff/kds/index': ExtractProps<(typeof import('../../inertia/pages/staff/kds/index.tsx'))['default']>
    'staff/tables/index': ExtractProps<(typeof import('../../inertia/pages/staff/tables/index.tsx'))['default']>
    'staff/tables/show': ExtractProps<(typeof import('../../inertia/pages/staff/tables/show.tsx'))['default']>
  }
}
