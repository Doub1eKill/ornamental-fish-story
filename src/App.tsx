import SceneChrome from "./components/SceneChrome";
import { useScrollRestoration } from "./lib/useScrollRestoration";
import { sceneMeta, ui } from "./data/scenes";
import HeroScene from "./scenes/HeroScene";
import TraitsScene from "./scenes/TraitsScene";
import AnatomyScene from "./scenes/AnatomyScene";
import TropicalScene from "./scenes/TropicalScene";
import ColdwaterScene from "./scenes/ColdwaterScene";
import PlantsScene from "./scenes/PlantsScene";
import AquascapeScene from "./scenes/AquascapeScene";
import FactorsScene from "./scenes/FactorsScene";
import EndingScene from "./scenes/EndingScene";

export default function App() {
  useScrollRestoration();

  return (
    <>
      <a className="skip-link" href="#main">
        {ui.skipToContent}
      </a>
      <SceneChrome scenes={sceneMeta} navLabel={ui.sceneNav} />
      <main id="main" tabIndex={-1}>
        <HeroScene />
        <TraitsScene />
        <AnatomyScene />
        <TropicalScene />
        <ColdwaterScene />
        <PlantsScene />
        <AquascapeScene />
        <FactorsScene />
        <EndingScene />
      </main>
    </>
  );
}
