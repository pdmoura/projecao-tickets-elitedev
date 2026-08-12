import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Uso responsável"
      intro="Estes termos apresentam as regras básicas para usar a Projeção na descoberta de sessões, compra simulada e validação de ingressos."
      sections={[
        {
          title: "Como a plataforma funciona",
          body: "A Projeção permite descobrir sessões publicadas, selecionar lugares, realizar uma compra simulada e apresentar um ingresso para validação na entrada. O acesso a cada área depende do papel autorizado da conta.",
        },
        {
          title: "Contas e ingressos",
          body: "Você é responsável por manter seus dados de acesso em segurança e por utilizar apenas os ingressos associados à sua conta. O ingresso e seu QR devem ser usados somente para a sessão correta.",
        },
        {
          title: "Pagamento simulado",
          body: "Os pagamentos disponíveis nesta versão são testes reproduzíveis. Eles não processam cobrança real e não representam uma relação comercial fora do ambiente de demonstração.",
        },
        {
          title: "Evolução do sistema",
          body: "A plataforma pode evoluir com novas integrações, regras operacionais e canais de atendimento. Alterações relevantes destes termos poderão ser refletidas nesta página.",
        },
      ]}
      title="Termos de uso"
    />
  );
}
