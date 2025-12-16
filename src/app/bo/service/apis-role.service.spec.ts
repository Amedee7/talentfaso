import { TestBed } from '@angular/core/testing';

import { ApisRoleService } from './apis-role.service';

describe('ApisRoleService', () => {
  let service: ApisRoleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApisRoleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
