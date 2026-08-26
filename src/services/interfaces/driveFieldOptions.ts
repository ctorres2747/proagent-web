export interface DriveFieldOption {
  value: string;
  label: string;
}

export interface DriveFieldOptions {
  parkingDetail: DriveFieldOption[];
  propertyLiens: DriveFieldOption[];
}

export interface DriveFieldOptionsService {
  list(token?: string): Promise<DriveFieldOptions>;
}
