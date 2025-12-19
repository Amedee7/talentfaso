import { TestBed } from '@angular/core/testing';

import { ApisNotificationService } from './apis-notification.service';

describe('ApisNotificationService', () => {
  let service: ApisNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApisNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
