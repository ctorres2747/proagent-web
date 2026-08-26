import type { DriveFieldOptionsService } from "@/services/interfaces/driveFieldOptions";
import {
  DRIVE_PARKING_OPTIONS,
  DRIVE_PROPERTY_LIENS_OPTIONS,
} from "@/lib/driveFieldOptions";

export const mockDriveFieldOptionsService: DriveFieldOptionsService = {
  async list() {
    return {
      parkingDetail: [...DRIVE_PARKING_OPTIONS],
      propertyLiens: [...DRIVE_PROPERTY_LIENS_OPTIONS],
    };
  },
};
