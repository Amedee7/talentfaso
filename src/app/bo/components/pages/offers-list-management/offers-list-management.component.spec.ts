import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OffersListManagementComponent } from './offers-list-management.component';

describe('OffersListManagementComponent', () => {
  let component: OffersListManagementComponent;
  let fixture: ComponentFixture<OffersListManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OffersListManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OffersListManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
