import { NextResponse } from "next/server";

export async function GET() {
  try {
    const telefonesUteis = [
      // EMERGÊNCIA & SEGURANÇA
      { id: "1", titulo: "Polícia Militar", categoria: "Emergência", telefone: "190", horario: "24h", icone: "🚨" },
      { id: "2", titulo: "SAMU", categoria: "Emergência médica", telefone: "192", horario: "24h", icone: "🚑" },
      { id: "3", titulo: "Corpo de Bombeiros", categoria: "Emergência", telefone: "193", horario: "24h", icone: "🚒" },
      { id: "4", titulo: "Defesa Civil", categoria: "Emergência", telefone: "199", horario: "24h", icone: "⚠️" },
      { id: "5", titulo: "Guarda Civil Municipal", categoria: "Segurança", telefone: "153", horario: "24h", icone: "🛡️" },
      { id: "6", titulo: "Disque Direitos Humanos", categoria: "Direitos humanos", telefone: "100", horario: "24h", icone: "👥" },
      { id: "7", titulo: "Central da Mulher", categoria: "Violência contra a mulher", telefone: "180", horario: "24h", icone: "🟣" },

      // PREFEITURA & SERVIÇOS
      { id: "8", titulo: "Prefeitura de Rio Claro", categoria: "Prefeitura", telefone: "(19) 3526-7100", horario: "Comercial", icone: "🏛️" },
      { id: "9", titulo: "Ouvidoria Municipal (156)", categoria: "Reclamações/solicitações", telefone: "156", horario: "Comercial", icone: "📢" },
      { id: "10", titulo: "Ouvidoria Municipal (Tel)", categoria: "Reclamações/solicitações", telefone: "(19) 3526-7145", horario: "Comercial", icone: "📢" },
      { id: "11", titulo: "Serviços Públicos", categoria: "Manutenção urbana", telefone: "(19) 3527-2763", horario: "Comercial", icone: "🔧" },
      { id: "12", titulo: "Iluminação Pública (Prefeitura)", categoria: "Iluminação", telefone: "(19) 3526-7127", horario: "Comercial", icone: "💡" },
      { id: "13", titulo: "Iluminação Pública WhatsApp", categoria: "Iluminação", telefone: "(19) 99495-9124", horario: "WhatsApp", icone: "💬", isWhatsapp: true },
      { id: "14", titulo: "Secretaria de Obras", categoria: "Obras públicas", telefone: "(19) 3522-1979", horario: "Comercial", icone: "🏗️" },
      { id: "15", titulo: "Mobilidade Urbana", categoria: "Trânsito", telefone: "(19) 3522-1919", horario: "Comercial", icone: "🚦" },
      { id: "16", titulo: "Departamento de Transporte", categoria: "Transporte", telefone: "(19) 3522-1990", horario: "Comercial", icone: "🚌" },
      { id: "17", titulo: "Departamento de Trânsito", categoria: "Trânsito/sinalização", telefone: "(19) 3522-1902", horario: "Comercial", icone: "🛑" },
      { id: "18", titulo: "Meio Ambiente", categoria: "Meio ambiente", telefone: "(19) 3522-1997", horario: "Comercial", icone: "🌿" },
      { id: "19", titulo: "Resíduos Sólidos", categoria: "Lixo/resíduos", telefone: "(19) 3522-2944", horario: "Comercial", icone: "🗑️" },
      { id: "20", titulo: "Proteção Animal / Canil", categoria: "Animais", telefone: "(19) 3532-4115", horario: "Comercial", icone: "🐶" },
      { id: "21", titulo: "Zoonoses / CCZ", categoria: "Zoonoses", telefone: "(19) 3522-1435", horario: "Comercial", icone: "🐾" },
      { id: "22", titulo: "Procon Centro", categoria: "Defesa do consumidor", telefone: "(19) 3533-1944", horario: "Comercial", icone: "⚖️" },
      { id: "23", titulo: "Procon Chervezon", categoria: "Defesa do consumidor", telefone: "(19) 3523-5985", horario: "Comercial", icone: "⚖️" },
      { id: "24", titulo: "Pessoa com Deficiência", categoria: "Inclusão", telefone: "(19) 3526-7138", horario: "Comercial", icone: "♿" },
      { id: "25", titulo: "Direitos da Pessoa com Deficiência (Zap)", categoria: "Inclusão", telefone: "(19) 98911-8607", horario: "WhatsApp", icone: "💬", isWhatsapp: true },
      { id: "26", titulo: "Desenvolvimento Social", categoria: "Assistência social", telefone: "(19) 3522-1930", horario: "Comercial", icone: "🤝" },
      { id: "27", titulo: "Sala do Empreendedor / SDE (Zap)", categoria: "Empreendedorismo", telefone: "(19) 2112-5029", horario: "WhatsApp", icone: "💬", isWhatsapp: true },
      { id: "28", titulo: "Sala de Inovação", categoria: "Inovação", telefone: "(19) 3522-1955", horario: "Comercial", icone: "💡" },
      { id: "29", titulo: "Fundo Social de Solidariedade (Zap)", categoria: "Social", telefone: "(19) 99439-4433", horario: "WhatsApp", icone: "💬", isWhatsapp: true },
      { id: "30", titulo: "Centro de Qualificação Profissional (Zap)", categoria: "Cursos", telefone: "(19) 98912-1015", horario: "WhatsApp", icone: "💬", isWhatsapp: true },
      { id: "31", titulo: "Vigilância Epidemiológica (Zap)", categoria: "Saúde", telefone: "(19) 98277-0204", horario: "WhatsApp", icone: "💬", isWhatsapp: true },
      { id: "32", titulo: "Cidade Empreendedora (Zap)", categoria: "Empreendedorismo", telefone: "(19) 99934-5906", horario: "WhatsApp", icone: "💬", isWhatsapp: true },

      // ÁGUA, ENERGIA & UTILIDADES ESSENCIAIS
      { id: "33", titulo: "DAAE Rio Claro (Água)", categoria: "Água", telefone: "0800 019 0505", horario: "24h", icone: "💧", isWhatsapp: true },
      { id: "34", titulo: "DAAE – Esgoto", categoria: "Esgoto", telefone: "0800 771 0001", horario: "—", icone: "🚰" },
      { id: "35", titulo: "Neoenergia Elektro (Energia)", categoria: "Energia", telefone: "0800 701 0102", horario: "24h", icone: "⚡" },
      { id: "36", titulo: "Neoenergia Elektro WhatsApp", categoria: "Energia", telefone: "(19) 2122-1696", horario: "WhatsApp", icone: "💬", isWhatsapp: true },

      // OPERADORAS & INTERNET
      { id: "37", titulo: "Claro Residencial", categoria: "Internet", telefone: "10621", horario: "—", icone: "📺" },
      { id: "38", titulo: "Claro Móvel", categoria: "Celular", telefone: "1052", horario: "—", icone: "📱" },
      { id: "39", titulo: "TIM", categoria: "Celular", telefone: "*1056", horario: "—", icone: "📱" },
      { id: "40", titulo: "TIM UltraFibra", categoria: "Internet", telefone: "10341", horario: "—", icone: "🌐" },
      { id: "41", titulo: "Vivo", categoria: "Internet", telefone: "10315", horario: "—", icone: "📱" },
      { id: "42", titulo: "Algar Telecom", categoria: "Internet", telefone: "10312", horario: "24h", icone: "☎️" },
      { id: "43", titulo: "Anatel", categoria: "Reclamação", telefone: "1331", horario: "—", icone: "📋" },
      { id: "44", titulo: "Desktop Internet", categoria: "Internet", telefone: "0800 731 3100", horario: "—", icone: "💻" },

      // SAÚDE & HOSPITAIS
      { id: "45", titulo: "Fundação Municipal de Saúde", categoria: "Saúde", telefone: "(19) 3522-3600", horario: "Comercial", icone: "🏥" },
      { id: "46", titulo: "UPA Bairro do Estádio", categoria: "Urgência", telefone: "(19) 3522-1818", horario: "24h", icone: "🏥" },
      { id: "47", titulo: "UPA Chervezon", categoria: "Urgência", telefone: "(19) 3533-7272", horario: "24h", icone: "🏥" },
      { id: "48", titulo: "PA Nossa Senhora de Lourdes", categoria: "Urgência", telefone: "(19) 3533-5484", horario: "24h", icone: "🏥" },
      { id: "49", titulo: "Pronto-Socorro Ginecológico/Obstetrícia", categoria: "Saúde", telefone: "(19) 3535-7002", horario: "24h", icone: "🩺" },
      { id: "50", titulo: "CAPS III 18 de Maio", categoria: "Saúde mental", telefone: "(19) 3536-3365", horario: "24h", icone: "🧠" },
      { id: "51", titulo: "Santa Casa", categoria: "Hospital", telefone: "(19) 3535-7000", horario: "—", icone: "🏨" },
      { id: "52", titulo: "Hospital São Rafael", categoria: "Hospital", telefone: "(19) 3535-7050", horario: "—", icone: "🏨" },
      { id: "53", titulo: "Hospital Unimed I", categoria: "Hospital", telefone: "(19) 3522-7000", horario: "—", icone: "🏥" },
      { id: "54", titulo: "Hospital Unimed II – Evangélico", categoria: "Hospital", telefone: "(19) 3524-2205", horario: "—", icone: "🏥" },
      { id: "55", titulo: "Santa Filomena", categoria: "Hospital", telefone: "(19) 2111-4500", horario: "—", icone: "🏨" },
      { id: "56", titulo: "Bezerra de Menezes", categoria: "Saúde mental", telefone: "(19) 3524-2700", horario: "—", icone: "🧠" },

      // UBS / USF / CRAS
      { id: "57", titulo: "UBS Jardim Chervezon", categoria: "UBS", telefone: "(19) 3534-5195", horario: "—", icone: "🏥" },
      { id: "58", titulo: "UBS 29", categoria: "UBS", telefone: "(19) 3524-9577", horario: "—", icone: "🏥" },
      { id: "59", titulo: "UBS Wenzel", categoria: "UBS", telefone: "(19) 3533-3343", horario: "—", icone: "🏥" },
      { id: "60", titulo: "UBS Vila Cristina", categoria: "UBS", telefone: "(19) 3527-2908", horario: "—", icone: "🏥" },
      { id: "61", titulo: "CRAS Mãe Preta / Jardim Bandeirantes", categoria: "Assistência social", telefone: "(19) 3524-9954", horario: "8h–17h", icone: "🤝" },
      { id: "62", titulo: "CRAS Jardim Brasília", categoria: "Assistência social", telefone: "(19) 3533-3752", horario: "8h–17h", icone: "🤝" },
      { id: "63", titulo: "Conselho Tutelar Sul", categoria: "Criança/adolescente", telefone: "(19) 3533-5411", horario: "Plantão", icone: "👶" },
      { id: "64", titulo: "Conselho Tutelar Norte", categoria: "Criança/adolescente", telefone: "(19) 99336-6682", horario: "Plantão", icone: "👶", isWhatsapp: true },
      { id: "65", titulo: "INSS", categoria: "Previdência", telefone: "135", horario: "Seg–sáb", icone: "📄" },
      { id: "66", titulo: "Correios", categoria: "Encomendas", telefone: "3003-0100", horario: "—", icone: "📦" }
    ];

    return NextResponse.json({ success: true, telefones: telefonesUteis });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro ao buscar telefones" }, { status: 500 });
  }
}