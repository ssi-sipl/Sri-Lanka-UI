import { EventEmitter } from "events";

const globalForEmitter = global as unknown as {
  emitter: EventEmitter | undefined;
};

export const alertEmitter =
  globalForEmitter.emitter ?? new EventEmitter();

// Set max listeners to prevent memory warning on frequent client connections
alertEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalForEmitter.emitter = alertEmitter;
}
