import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillTypesManagementComponent } from './skill-types-management.component';

describe('SkillTypesManagementComponent', () => {
  let component: SkillTypesManagementComponent;
  let fixture: ComponentFixture<SkillTypesManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillTypesManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SkillTypesManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
