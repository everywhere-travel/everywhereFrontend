export interface EmailRequestDTO {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
}
