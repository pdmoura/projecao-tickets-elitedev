import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Informações importantes"
      intro="Esta política explica, em linguagem simples, como os dados usados na Projeção apoiam a experiência de sessões, ingressos e entrada na sala."
      sections={[
        {
          title: "Dados usados pela plataforma",
          body: "Podemos usar dados básicos de login, reservas, ingressos e validações de entrada. Eles permitem identificar a conta, exibir os ingressos corretos e manter o funcionamento das sessões organizadas na plataforma.",
        },
        {
          title: "Reservas e pagamento de teste",
          body: "A Projeção registra as informações necessárias para a reserva e o ingresso. O pagamento atual é simulado para fins de demonstração: nenhum cartão é processado como pagamento real.",
        },
        {
          title: "QR e validação de acesso",
          body: "O QR e o código manual do ingresso são usados exclusivamente para validar a entrada em uma sessão. Eles não substituem suas informações de acesso nem são exibidos como dados públicos da conta.",
        },
        {
          title: "Contato",
          body: "Para dúvidas sobre esta política, escreva para privacidade@projecao.local. Este é um canal demonstrativo do projeto e pode ser substituído por um contato oficial em uma futura operação.",
        },
      ]}
      title="Política de privacidade"
    />
  );
}
