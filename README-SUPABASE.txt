LIFEHUB v72 — SUPABASE

IMPORTANT PER A LA PRIMERA SINCRONITZACIÓ:
- Configura i entra PRIMER des del Mac on tens les dades que vols conservar.
- Si Supabase encara no té dades, LifeHub pujarà automàticament l'estat local d'aquest primer dispositiu.
- Després entra des de l'iPhone: descarregarà les mateixes dades del núvol.

PASSOS:
1. Crea un projecte a Supabase.
2. SQL Editor > New query > enganxa i executa supabase-setup.sql.
3. Authentication > Users > crea el teu usuari (email + password).
4. Copia Project URL i Publishable key del projecte.
5. Enganxa-les a supabase-config.js.
6. Puja tots els fitxers de v72 a GitHub i fes Push.
7. Entra primer des del Mac.
8. Després entra des de l'iPhone.

SEGURETAT:
- La publishable key és correcta per al navegador.
- NO facis servir mai una secret key ni service_role al frontend.
- RLS limita cada usuari a la seva pròpia fila.
