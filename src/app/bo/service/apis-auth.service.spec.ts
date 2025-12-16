import { TestBed } from '@angular/core/testing';

import { ApisAuthService } from './apis-auth.service';

describe('ApisAuthService', () => {
  let service: ApisAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApisAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
