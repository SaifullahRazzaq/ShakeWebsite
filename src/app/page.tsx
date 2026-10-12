import FlavorProvider from "@/components/core/FlavorProvider";
import Nav from "@/components/core/Nav";
import Footer from "@/components/core/Footer";

import HeroOcean from "@/components/scenes/HeroOcean";
import UnderWorld from "@/components/scenes/UnderWorld";
import FlavorWorlds from "@/components/scenes/FlavorWorlds";
import FlavorCollision from "@/components/scenes/FlavorCollision";
import PerfectPour from "@/components/scenes/PerfectPour";
import LiquidTypography from "@/components/scenes/LiquidTypography";
import FruitGravity from "@/components/scenes/FruitGravity";
import BottleLineup from "@/components/scenes/BottleLineup";
import SurfLine from "@/components/scenes/SurfLine";
import ShakeBuilder from "@/components/scenes/ShakeBuilder";
import Viscosity from "@/components/scenes/Viscosity";
import ColdScene from "@/components/scenes/ColdScene";
import MenuScene from "@/components/scenes/MenuScene";
import Social from "@/components/scenes/Social";
import Locations from "@/components/scenes/Locations";
import BigWave from "@/components/scenes/BigWave";

/**
 * One film, in order. The rhythm column in STORYBOARD.md is the reason for this sequence:
 * loud never follows loud. The quiet scenes are not filler — 19 and 20 exist so that 24
 * lands, and cutting them would cost the finale more than it saves in length.
 */
export default function Home() {
  return (
    <FlavorProvider>
      <Nav />

      {/* 01–07 · the hero film: ocean, collision, freeze, orbit, drop, dive */}
      <HeroOcean />

      {/* 08–09 · under the shake, and the flavour that changes it */}
      <UnderWorld />

      {/* 10–11 · the five worlds, then two of them meeting */}
      <FlavorWorlds />
      <FlavorCollision />

      {/* 12–14 · the pour, the word, the fruit */}
      <PerfectPour />
      <LiquidTypography />
      <FruitGravity />

      {/* 15–16 · what we sell */}
      <BottleLineup />
      <SurfLine />

      {/* 17–18 · your turn */}
      <ShakeBuilder />

      {/* 19–21 · tactile, cold, and the list */}
      <Viscosity />
      <ColdScene />
      <MenuScene />

      {/* 22–23 · other people, and where */}
      <Social />
      <Locations />

      {/* 24–25 · the climax and the last frame */}
      <BigWave />
      <Footer />
    </FlavorProvider>
  );
}
