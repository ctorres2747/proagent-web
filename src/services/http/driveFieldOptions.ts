import type {
  DriveFieldOptions,
  DriveFieldOptionsService,
} from "@/services/interfaces/driveFieldOptions";
import { apiFetch } from "./client";

interface RawDriveFieldOptions {
  parking_detail?: { value: string; label: string }[];
  property_liens?: { value: string; label: string }[];
}

export const driveFieldOptionsService: DriveFieldOptionsService = {
  async list(token?: string): Promise<DriveFieldOptions> {
    const raw = await apiFetch<RawDriveFieldOptions>(
      "/api/web/drive/field-options",
      { token },
    );
    return {
      parkingDetail: raw.parking_detail ?? [],
      propertyLiens: raw.property_liens ?? [],
    };
  },
};
