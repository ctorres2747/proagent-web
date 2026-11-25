/**
 * Service locator. Selects the mock or HTTP implementation based on
 * USE_HTTP_API (derived from NEXT_PUBLIC_API_URL / NEXT_PUBLIC_USE_MOCKS).
 *
 * Screens depend only on the interfaces + these exports, never on the concrete
 * adapter — so migrating to /api/web/* means swapping adapters in http/*, not
 * touching the UI.
 */
import { USE_HTTP_API } from "@/config/env";

import { agentesService as mockAgentes } from "./mocks/agentes";
import { authService as mockAuth } from "./mocks/auth";
import { channelsService as mockChannels } from "./mocks/channels";
import { criteriosService as mockCriterios } from "./mocks/criterios";
import { fichasService as mockFichas, leadsService as mockLeads } from "./mocks/leads";
import { profileService as mockProfile } from "./mocks/profile";
import { propertiesService as mockProperties } from "./mocks/properties";
import { publicationsService as mockPublications } from "./mocks/publications";
import { scraperService as mockScraper } from "./mocks/scraper";
import { wasiFeaturesService as mockWasiFeatures } from "./mocks/wasiFeatures";
import { wasiZonasService as mockWasiZonas } from "./mocks/wasiZonas";
import { wasiCiudadesService as mockWasiCiudades } from "./mocks/wasiCiudades";
import { wasiLocalidadesService as mockWasiLocalidades } from "./mocks/wasiLocalidades";
import { dashboardService as mockDashboard } from "./mocks/dashboard";
import { adminDashboardService as mockAdminDashboard } from "./mocks/adminDashboard";
import { metasService as mockMetas } from "./mocks/metas";
import { clientsService as mockClients } from "./mocks/clients";
import { prospectsService as mockProspects } from "./mocks/prospects";
import { agentesService as httpAgentes } from "./http/agentes";
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
import { wasiZonasService as httpWasiZonas } from "./http/wasiZonas";
import { wasiCiudadesService as httpWasiCiudades } from "./http/wasiCiudades";
import { wasiLocalidadesService as httpWasiLocalidades } from "./http/wasiLocalidades";
import { dashboardService as httpDashboard } from "./http/dashboard";
import { adminDashboardService as httpAdminDashboard } from "./http/adminDashboard";
import { metasService as httpMetas } from "./http/metas";
import { clientsService as httpClients } from "./http/clients";
import { prospectsService as httpProspects } from "./http/prospects";
import { navCountsService as httpNavCounts } from "./http/navCounts";
import { driveFieldOptionsService as httpDriveFieldOptions } from "./http/driveFieldOptions";
import { facebookConnectService as httpFacebookConnect } from "./http/facebookConnect";
import { googleDriveService as httpGoogleDrive } from "./http/googleDrive";
import { workerService as httpWorker } from "./http/workerEnroll";
import { marketplaceLoginService as httpMarketplaceLogin } from "./http/marketplaceLogin";
import { soporteService as httpSoporte } from "./http/soporte";
import { mockDriveFieldOptionsService as mockDriveFieldOptions } from "./mocks/driveFieldOptions";
import {
  facebookConnectService as mockFacebookConnect,
  googleDriveService as mockGoogleDrive,
  marketplaceLoginService as mockMarketplaceLogin,
  navCountsService as mockNavCounts,
  soporteService as mockSoporte,
  workerService as mockWorker,
} from "./mocks/integrations";

import type { AgentesService } from "./interfaces/agentes";
import type { AuthService } from "./interfaces/auth";
import type { ChannelsService } from "./interfaces/channels";
import type { CriteriosService } from "./interfaces/criterios";
import type { FichasService, LeadsService } from "./interfaces/leads";
import type { ProfileService } from "./interfaces/profile";
import type { PropertiesService } from "./interfaces/properties";
import type { PublicationsService } from "./interfaces/publications";
import type { ScraperService } from "./interfaces/scraper";
import type { DashboardService } from "./interfaces/dashboard";
import type { AdminDashboardService } from "./interfaces/adminDashboard";
import type { MetasService } from "./interfaces/metas";
import type { ClientsService } from "./interfaces/clients";
import type { ProspectsService } from "./interfaces/prospects";
import type { DriveFieldOptionsService } from "./interfaces/driveFieldOptions";

export const agentesService: AgentesService = USE_HTTP_API
  ? httpAgentes
  : mockAgentes;
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
export const wasiZonasService = USE_HTTP_API ? httpWasiZonas : mockWasiZonas;
export const wasiCiudadesService = USE_HTTP_API ? httpWasiCiudades : mockWasiCiudades;
export const wasiLocalidadesService = USE_HTTP_API
  ? httpWasiLocalidades
  : mockWasiLocalidades;
export const dashboardService: DashboardService = USE_HTTP_API
  ? httpDashboard
  : mockDashboard;
export const adminDashboardService: AdminDashboardService = USE_HTTP_API
  ? httpAdminDashboard
  : mockAdminDashboard;
export const metasService: MetasService = USE_HTTP_API ? httpMetas : mockMetas;
export const clientsService: ClientsService = USE_HTTP_API ? httpClients : mockClients;
export const prospectsService: ProspectsService = USE_HTTP_API
  ? httpProspects
  : mockProspects;

export const navCountsService: Pick<typeof httpNavCounts, "get"> = USE_HTTP_API
  ? httpNavCounts
  : mockNavCounts;
export const driveFieldOptionsService: DriveFieldOptionsService = USE_HTTP_API
  ? httpDriveFieldOptions
  : mockDriveFieldOptions;
export const facebookConnectService: typeof httpFacebookConnect = USE_HTTP_API
  ? httpFacebookConnect
  : mockFacebookConnect;
export const googleDriveService: typeof httpGoogleDrive = USE_HTTP_API
  ? httpGoogleDrive
  : mockGoogleDrive;
export const workerService: typeof httpWorker = USE_HTTP_API ? httpWorker : mockWorker;
export const marketplaceLoginService: typeof httpMarketplaceLogin = USE_HTTP_API
  ? httpMarketplaceLogin
  : mockMarketplaceLogin;
export const soporteService: typeof httpSoporte = USE_HTTP_API ? httpSoporte : mockSoporte;

export type { AgenteResumen, AgentesService } from "./interfaces/agentes";
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
export type {
  ScraperRunOptions,
  ScraperRunResult,
  ScraperService,
  ScraperStatus,
} from "./interfaces/scraper";
export type {
  DesempenoDashboard,
  DashboardService,
} from "./interfaces/dashboard";
export type {
  AdminDashboard,
  AdminDashboardService,
} from "./interfaces/adminDashboard";
export type { MetasAnio, MetasService, MetaMes } from "./interfaces/metas";
export type {
  Client,
  ClientChannel,
  ClientChannelCount,
  ClientDiscardReason,
  ClientLinkedProperty,
  ClientPaymentMethod,
  ClientsService,
  ClientStage,
  ClientTemperature,
  ClientWrite,
} from "./interfaces/clients";
