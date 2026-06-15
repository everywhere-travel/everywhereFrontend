import { Injectable } from '@angular/core';
import { AuthResponse } from '../../shared/models/auth/auth-response-model';
@Injectable({
  providedIn: 'root'
})
export class StorageService {
    private authKey="govench_auth"

    constructor() {}

    setAuthData(data:AuthResponse):void {
        sessionStorage.setItem(this.authKey,JSON.stringify(data))
    }

    getAuthData(): AuthResponse | null{
        const data = sessionStorage.getItem(this.authKey);
        return data ? JSON.parse(data) as AuthResponse : null;
    }

    clearAuthData():void {
        sessionStorage.removeItem(this.authKey);
    }

}