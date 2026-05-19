# Procédure de Rollback

Ce document décrit les étapes pour effectuer un retour en arrière rapide et sécurisé en cas d'anomalie critique en production.

---

## 💸 Catalogue d'Offres & Tarifs

Si la base de données Supabase subit une panne prolongée ou si le schéma de la table `formation_offers` est corrompu, vous pouvez forcer le Portal à utiliser les valeurs statiques de secours.

### Solution 1 : Forcer le Fallback Statique dans le code
Dans le fichier `src/hooks/useFormationOffers.ts`, modifiez la fonction `useFormationOffers` pour retourner directement le tableau `FALLBACK_JOURNEYS` sans interroger Supabase :

```typescript
export function useFormationOffers() {
  // Remplacer l'appel query par un retour direct :
  return {
    data: FALLBACK_JOURNEYS,
    isLoading: false,
    error: null,
  };
}
```

### Solution 2 : Revenir à un commit stable
Si besoin, vous pouvez annuler la suppression de `pricing.ts` et ré-installer l'ancien comportement en effectuant un `git revert` sur le commit de suppression :
```bash
# Annuler le commit de suppression des fichiers de pricing
git revert 8998208
```

---

## 🔒 Authentification & Middleware Admin

Si l'intégration du middleware d'authentification Supabase bloquait anormalement les requêtes serveur :
1. Ouvrez `src/start.ts`.
2. Commentez ou supprimez la ligne `functionMiddleware`:
```typescript
export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
  // functionMiddleware: [attachSupabaseAuth], // Commenter cette ligne
}));
```
3. Re-déployez. L'application repassera sur un comportement de bypass local sans middleware bloquant.
