import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { map, catchError, throwError, of } from 'rxjs';
import { environment } from '@env/environment';
import type { Business } from '../auth/models/auth.model';

interface BusinessesApiResponse {
  status: string;
  statusMessage: string;
  displayMessage: string;
  businesses: Business[];
}

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiBaseUrl}/businesses`;

  getBusinesses(): Observable<Business[]> {
    return this.http.get<BusinessesApiResponse>(this.BASE).pipe(
      map(res => res.businesses ?? []),
      catchError(err => {
        // Guard: backend returns non-2xx but body says success
        if (err?.error?.status === 'success') {
          return of((err.error.businesses ?? []) as Business[]);
        }
        return throwError(() => err);
      }),
    );
  }
}
