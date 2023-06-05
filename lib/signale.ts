import { Signale, SignaleOptions } from "signale";

const options = {
  disabled: false,
  interactive: false,
  logLevel: "info",
  secrets: [],
  stream: process.stdout,
  types: {
    sentMessage: {
      badge: "📩",
      color: "blue",
      label: "sentMessage",
      logLevel: "info",
    },
    connection: {
      badge: "🙋🏻‍♂️",
      color: "green",
      label: "connection",
      logLevel: "info",
    },
    monitor: {
      badge: "👀",
      color: "yellow",
      label: "monitor",
      logLevel: "info",
    },
  },
};

const customSignale = new Signale(options);

customSignale.config({
  displayBadge: true,
  displayFilename: true,
  displayScope: true,
});

if (process.env.NODE_ENV !== "development") {
  customSignale.disable();
}

const signale = customSignale;

export default signale;
