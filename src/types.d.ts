export type ChatBot = {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  context: string;
  config: string | null;
  isActivated: boolean;
  createdAt: Date;
  updatedAt: Date;
};
