import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import UserTransformer from '#transformers/user_transformer'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  share(ctx: HttpContext) {
    /**
     * The share method is called everytime an Inertia page is rendered. In
     * certain cases, a page may get rendered before the session middleware
     * or the auth middleware are executed. For example: During a 404 request.
     *
     * In that case, we must always assume that HttpContext is not fully hydrated
     * with all the properties
     */
    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      user: ctx.inertia.always(
        ctx.auth?.user ? UserTransformer.transform(ctx.auth.user) : undefined
      ),
      flash: {
        notification: ctx.session?.flashMessages.get('notification'),
        error: ctx.session?.flashMessages.get('error'),
        success: ctx.session?.flashMessages.get('success'),
      },
    }
  }

  /**
   * The flash bag is sent to every Inertia page as a top-level "flash" field
   * (a sibling of "props") and is read on the client using "usePage().flash".
   *
   * Just like the share method, the flash method may run before the session
   * middleware, so HttpContext must be treated as partially hydrated.
   */
  flash(ctx: HttpContext) {
    const { session } = ctx as Partial<HttpContext>

    /**
     * Fetching the first error from the flash messages
     */
    return {
      error: session?.flashMessages.get('error') as string | undefined,
      success: session?.flashMessages.get('success') as string | undefined,
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)

    const output = await next()
    this.dispose(ctx)

    return output
  }
}

declare module '@adonisjs/inertia/types' {
  type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>
  export interface SharedProps extends MiddlewareSharedProps {}
}
