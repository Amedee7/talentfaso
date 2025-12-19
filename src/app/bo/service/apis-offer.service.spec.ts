import { TestBed } from '@angular/core/testing';

import { ApisOfferService } from './apis-offer.service';

describe('ApisOfferService', () => {
  let service: ApisOfferService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApisOfferService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
