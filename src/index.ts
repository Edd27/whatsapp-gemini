import "./config/env";
import { connectToWhatsApp } from "./config/whatsapp";

export async function bootstrap() {
  await connectToWhatsApp();
}

bootstrap();
