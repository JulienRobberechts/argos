
Soit une architecture hexagonal avec son frontend :
F: frontend
A: any entry adapter
B: the application and core together
C: the infra adapters

## 1. Les Tests Unitaires du Domaine et de l'application (Le Cœur)

* **Cible :** Les entités, les *Value Objects*, et les services du Domaine.
* **Stratégie :** Puisqu'il n'y a aucune dépendance technique, ces tests sont extrêmement rapides à exécuter. Vous devez y tester toutes les règles de gestion, les cas limites (*edge cases*) et les calculs critiques.
* **Approche possible :** **Property-Based Testing** (pour tester un large éventail de données d'entrée automatiquement).

Test: TU au niveau des méthodes sur B

---

## 2. Les Tests d'Architecture (Le Garde-Fou)

Avant même de tester le code, il faut tester que l'architecture hexagonale est respectée (par exemple, s'assurer que le Domaine n'importe rien venant de la couche infrastructure).

* **Cible :** La structure des packages et les règles d'importation.
* **Outils types :** *ArchUnit* (Java/Kotlin), *ArchUnitNET* (.NET), *dependency-cruiser* (JavaScript/TypeScript).
* **Stratégie :** Un test automatisé qui échoue dans la CI si un développeur tente d'importer un framework ou un driver de base de données directement dans le Domaine.

Test: frontière et dépendance entre A, B et C.

---

## 3. Les Tests des Adaptateurs de Gauche / API (Driving Adapters) d'entrée

Ces adaptateurs reçoivent les requêtes extérieures (ex: un contrôleur REST, un consommateur de messages RabbitMQ) et appellent les API du Domaine (*Inbound Ports*).

* **Cible :** La sérialisation/désérialisation (JSON), la validation des requêtes HTTP (les DTOs), la gestion des codes statuts (200, 400, 404, 500) et le routing.
* **Stratégie :** On utilise des **Mocks/Stubs** pour simuler le comportement du Domaine. On ne veut pas tester la logique métier ici, uniquement la couche de transport et de sérialisation.
* **Outils types :** *MockMvc* (Spring), *SuperTest* (Express), *WebTestClient*.

Test: Test au niveau de l'usage de A (api ou cli) et mock de la partie application.

---

## 4. Les Tests des Adaptateurs de Droite / Infrastructure (Driven Adapters)

Ces adaptateurs implémentent les interfaces du Domaine (*Outbound Ports*) pour interagir avec l'extérieur (bases de données, API tierces, systèmes de fichiers).

* **Cible :** Les requêtes SQL/NoSQL, la configuration des clients HTTP tiers, la correspondance (*mapping*) entre le modèle de données de l'infra et les entités du Domaine.
* **Stratégie :** **Tests d'intégration réels**. On n'utilise pas de mock pour la base de données ici. On veut s'assurer que la requête SQL est syntaxiquement correcte et fait ce qu'on attend d'elle.
* **Approche recommandée :** Utiliser des conteneurs éphémères (comme **Testcontainers**) pour lancer une vraie base de données (PostgreSQL, MongoDB) ou un simulateur d'API tierce (WireMock) isolé pour chaque run de test.

Test: Test au niveau de l'usage des ports d'infra C sans mock des systemes externes.
Lourd, couteux.

---

## 5. Les Tests de Contrat (Contract Testing)

L'architecture hexagonale multiplie les frontières (Ports). Les tests de contrat sécurisent ces frontières, surtout dans un monde de microservices.

* **Contrats Internes (Ports) :** S'assurer que l'implémentation de l'adaptateur de droite respecte scrupuleusement le contrat défini par le Port du Domaine. On peut utiliser le *Pattern des Tests Abstraits* (une suite de tests écrite pour le Port, jouée à la fois sur l'adaptateur réel et sur un *Fake* en mémoire).
* **Contrats Externes (API) :** S'assurer que les changements de l'API ne cassent pas les clients (Frontend ou autres microservices).
* **Outils types :** *Pact*, *Spring Cloud Contract*.


Test: 
    - avant / après d'une API ou d'une CLI.
    - différentes versions d'une meme interface infra : mock vs techno1 vs techno2.

---

## 6. Les Tests de use cases.

Ces tests valident un cas d'utilisation (*Use Case*) complet du point de vue de l'utilisateur ou du Product Owner.

Deux stratégies s'affrontent ici dans l'hexagone :

### Option A : L'approche par les Ports (Recommandée pour la vitesse)

On instancie le cas d'utilisation du domaine (*Inbound Port*), mais on remplace les adaptateurs de droite (base de données) par des **Fakes en mémoire** (ex: un `InMemoryUserRepository` qui stocke les données dans une simple `Map`).

* **Avantage :** Ultra rapide, teste 100% du workflow métier sans la lourdeur du réseau ou de la base de données. Idéal pour le BDD (Behavior-Driven Development) avec *Cucumber*.

TEsts: test de l'interface de l'application en faisant un test double (ou implementation inMemory ou autre) de la partie port d'infra. 

Test: B seulement depuis ses interface.

### Option B : L'approche End-to-End complète

On démarre l'application entière (souvent dans un conteneur), on injecte de vraies requêtes HTTP à l'entrée (gauche) et on laisse l'application interagir avec une vraie base de données de test (droite).

* **Avantage :** Confiance maximale.
* **Inconvénient :** Lent et plus difficile à maintenir. On limite généralement ces tests aux "chemins critiques" (*happy paths*).

Tests: A+B+C


Def:

Module : F, A, B , C sont des module
A peut etre api ou cli ou connecteur
B n'existe qu'en 1 exemplaire.
C existe en autant de port à couvrir x le nombre d'implementation, y compris les tests doubles.

Pyramide de test complete :

Types de tests :

Test unitaire = ne couvrant que du code interne à un module.
- TU du core
- TU de Front

- test d'archi hexagonale : vérification des références.

Test de 1 module = couvre un module dans son entiereté par sont interface. Et si besoin avec des tests double injectés.
- test module Adapter d'entrée (API, cli) => voir section 3
- test module du core avec des tests doubles des ports d'infra.
- test module de chacun des adapteurs de sortie qui implemente un port d'infra + comparaison entre les differentes implementations d'une meme interface infra pour valider la validité de chacun. Le but est d'avoir un test sur l'interface d'infra qui couvre toutes les implémentations si possible.

Test de 2 modules = couvre l'intégration de niveau 2 : 2 modules ensembles
- test adapter + core, avec port d'infra mockés.
- test core + infra, sans mock.
- test du frontend + API avec app mocké.

Test de 3 modules = couvre l'intégration de niveau 3 : 3 modules ensembles
- test front+adapter+core avec mock des interfaces d'infra.
- test adapter+core+infra sans mock

Test de 4 modules = couvre l'intégration de niveau 4 : 4 modules ensembles
- test E2E du systeme en utilisant des librairie de test UI.


