import { TestBed } from '@angular/core/testing';

import { ApisSkillTypeService } from './apis-skill-type.service';

describe('ApisSkillTypeService', () => {
  let service: ApisSkillTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApisSkillTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
