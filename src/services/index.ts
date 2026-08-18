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
import { criteriosService as mockCriterios } from "./mocks/criterios";
import { fichasService as mockFichas, leadsService as mockLeads } from "./mocks/leads";
import { profileService as mockProfile } from "./mocks/profile";
import { propertiesService as mockProperties } from "./mocks/properties";
import { publicationsService as mockPublications } from "./mocks/publications";
import { scraperService as mockScraper } from "./mocks/scraper";
import { wasiFeaturesService as mockWasiFeatures } from "./mocks/wasiFeatures";
import { authService as httpAuth } from "./http/auth";
import { channelsService as httpChannels } from "./http/channels";
import { criteriosService as httpCriterios } from "./http/criterios";
import { fichasService as httpFichas } from "./http/fichas";
import { leadsService as httpLeads } from "./http/leads";
import { profileService as httpProfile } from "./http/profile";
import { propertiesService as httpProperties } from "./http/properties";
import { publicationsService as httpPublications } from "./http/publications";
import { scraperService as httpScraper } from "./http/scraper";
import { wasiFeaturesService as httpWasiFeatures } from "./http/wasiFeatures";

import type { AuthService } from "./interfaces/auth";
import type { ChannelsService } from "./interfaces/channels";
import type { CriteriosService } from "./interfaces/criterios";
import type { FichasService, LeadsService } from "./interfaces/leads";
import type { ProfileService } from "./interfaces/profile";
import type { PropertiesService } from "./interfaces/properties";
import type { PublicationsService } from "./interfaces/publications";
import type { ScraperService } from "./interfaces/scraper";

export const authService: AuthService = USE_HTTP_API ? httpAuth : mockAuth;
export const channelsService: ChannelsService = USE_HTTP_API
  ? httpChannels
  : mockChannels;
export const leadsService: LeadsService = USE_HTTP_API ? httpLeads : mockLeads;
export const criteriosService: CriteriosService = USE_HTTP_API
  ? httpCriterios
  : mockCriterios;
export const fichasService: FichasService = USE_HTTP_API
  ? httpFichas
  : mockFichas;
export const profileService: ProfileService = USE_HTTP_API
  ? httpProfile
  : mockProfile;
export const propertiesService: PropertiesService = USE_HTTP_API
  ? httpProperties
  : mockProperties;
export const publicationsService: PublicationsService = USE_HTTP_API
  ? httpPublications
  : mockPublications;
export const scraperService: ScraperService = USE_HTTP_API
  ? httpScraper
  : mockScraper;
export const wasiFeaturesService = USE_HTTP_API
  ? httpWasiFeatures
  : mockWasiFeatures;

export type { AuthService } from "./interfaces/auth";
export type { ChannelsService, ChannelConnection, ChannelPatch } from "./interfaces/channels";
export type {
  CriteriosCaptacion,
  CriteriosCaptacionUpdate,
  CriteriosService,
} from "./interfaces/criterios";
export type {
  FichasService,
  Lead,
  LeadEstado,
  LeadsService,
} from "./interfaces/leads";
export type {
  AgentProfile,
  AgentProfileUpdate,
  ProfileService,
} from "./interfaces/profile";
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
export type { ScraperService, ScraperStatus } from "./interfaces/scraper";
