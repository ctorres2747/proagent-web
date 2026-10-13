import type { ProspectsService } from "../interfaces/prospects";

export const prospectsService: ProspectsService = {
  async list() {
    return [];
  },
  async counts() {
    return { new: 0, contacted: 0, paused: 0, all: 0, byChannel: {} };
  },
  async interaction(id) {
    throw new Error(`Mock: interaction ${id}`);
  },
  async qualify() {
    return { clienteId: "0" };
  },
  async discard(id) {
    throw new Error(`Mock: discard ${id}`);
  },
  async merge() {
    return { clienteId: "0" };
  },
  async pause(id) {
    throw new Error(`Mock: pause ${id}`);
  },
  async resume(id) {
    throw new Error(`Mock: resume ${id}`);
  },
  async undo(id) {
    throw new Error(`Mock: undo ${id}`);
  },
};
