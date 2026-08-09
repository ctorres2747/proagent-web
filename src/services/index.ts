/**
 * Service locator. Selects the mock or HTTP implementation based on
 * USE_HTTP_API (derived from NEXT_PUBLIC_API_URL / NEXT_PUBLIC_USE_MOCKS).
 *
 * Screens depend only on the interfaces + these exports, never on the concrete
 * adapter — so migrating to /api/web/* means swapping adapters in http/*, not
 * touching the UI.
 */
import { USE_HTTP_API } from "@/config/env";

import { authService as mockAuth } from "./mocks/auth";
import { propertiesService as mockProperties } from "./mocks/properties";
import { authService as httpAuth } from "./http/auth";
import { propertiesService as httpProperties } from "./http/properties";

import type { AuthService } from "./interfaces/auth";
import type { PropertiesService } from "./interfaces/properties";

export const authService: AuthService = USE_HTTP_API ? httpAuth : mockAuth;
export const propertiesService: PropertiesService = USE_HTTP_API
  ? httpProperties
  : mockProperties;

export type { AuthService } from "./interfaces/auth";
export type {
  PropertiesService,
  Property,
} from "./interfaces/properties";
