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
import { channelsService as mockChannels } from "./mocks/channels";
import { propertiesService as mockProperties } from "./mocks/properties";
import { publicationsService as mockPublications } from "./mocks/publications";
import { authService as httpAuth } from "./http/auth";
import { channelsService as httpChannels } from "./http/channels";
import { propertiesService as httpProperties } from "./http/properties";
import { publicationsService as httpPublications } from "./http/publications";

import type { AuthService } from "./interfaces/auth";
import type { ChannelsService } from "./interfaces/channels";
import type { PropertiesService } from "./interfaces/properties";
import type { PublicationsService } from "./interfaces/publications";

export const authService: AuthService = USE_HTTP_API ? httpAuth : mockAuth;
export const channelsService: ChannelsService = USE_HTTP_API
  ? httpChannels
  : mockChannels;
export const propertiesService: PropertiesService = USE_HTTP_API
  ? httpProperties
  : mockProperties;
export const publicationsService: PublicationsService = USE_HTTP_API
  ? httpPublications
  : mockPublications;

export type { AuthService } from "./interfaces/auth";
export type { ChannelsService, ChannelConnection } from "./interfaces/channels";
export type {
  PropertiesService,
  Property,
} from "./interfaces/properties";
export type {
  PublicationsService,
  Publication,
  PublicationFilter,
  ChannelResult,
} from "./interfaces/publications";
