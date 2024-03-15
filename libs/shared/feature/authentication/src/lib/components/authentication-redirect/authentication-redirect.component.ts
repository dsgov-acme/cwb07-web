import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, Optional } from '@angular/core';
import { LoadingService, NuverialButtonComponent, NuverialCardComponent } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { of, tap } from 'rxjs';
import { AuthenticationBaseDirective } from '../../common';
import { AuthenticationProviderActions, CLIENT_AUTHENTICATION, IAuthenticatedError, IClientAuthenticationConfiguration } from '../../models';
import { AuthenticationService } from '../../services';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialCardComponent, NuverialButtonComponent],
  selector: 'dsg-authentication-redirect',
  standalone: true,
  styleUrls: ['./authentication-redirect.component.scss'],
  templateUrl: './authentication-redirect.component.html',
})
export class AuthenticationRedirectComponent extends AuthenticationBaseDirective {
  constructor(
    protected override readonly _authenticationService: AuthenticationService,
    @Optional() @Inject(CLIENT_AUTHENTICATION) protected override readonly _configuration: IClientAuthenticationConfiguration,
    protected override readonly _loggingService: LoggingService,
    private readonly _loadingService: LoadingService,
  ) {
    super(_authenticationService, _loggingService, _configuration);
  }
  public providerActions = AuthenticationProviderActions;
  public failureMessage = 'Encountered an error signing in, please try again.';

  public redirectResult$ = this._authenticationService.redirectResult$.pipe(
    this._loadingService.switchMapWithLoading(value => {
      return of(value).pipe(
        tap(result => {
          if (result === null) {
            this.signInWithRedirect();
          } else if ((result as IAuthenticatedError).code) {
            this.failureMessage = this._authenticationService.errorString(result as IAuthenticatedError);
          }
        }),
      );
    }),
  );

  public signInWithRedirect() {
    this._authenticationService.signInWithRedirect$();
  }
}
