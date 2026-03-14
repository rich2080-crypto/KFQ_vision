import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  const server = registerRoutes(app);

  if (process.env.NODE_ENV === "production") {
    const publicDir = path.join(__dirname, "public");
    app.use(express.static(publicDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  }

  const PORT = 5001;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
})();

