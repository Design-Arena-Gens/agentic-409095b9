"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import { Group, Mesh, Vector3 } from "three";

const baseColor = {
  uplifting: "#91c9ff",
  calming: "#a4d3d9",
  grounding: "#f3b0c3",
  celebratory: "#ffe08a",
  curious: "#d6b4ff",
} as const;

const accentColor = {
  uplifting: "#2471a3",
  calming: "#1f6f78",
  grounding: "#b23b6f",
  celebratory: "#e18900",
  curious: "#7647c7",
} as const;

export type AvatarMood = keyof typeof baseColor;

type AvatarProps = {
  mood: AvatarMood;
  speaking: boolean;
};

const Eye = ({
  position,
  radius,
  color,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
}) => (
  <mesh position={position}>
    <sphereGeometry args={[radius, 32, 32]} />
    <meshStandardMaterial color={color} />
  </mesh>
);

const CompanionFigure = ({ mood, speaking }: AvatarProps) => {
  const headRef = useRef<Group>(null);
  const torsoRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);

  const mouthRef = useRef<Mesh>(null);
  const colorSet = useMemo(
    () => ({
      primary: baseColor[mood],
      accent: accentColor[mood],
    }),
    [mood],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const subtleFloat = Math.sin(t) * 0.05;
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.15;
      headRef.current.position.y = 1.35 + subtleFloat;
    }
    if (torsoRef.current) {
      torsoRef.current.position.y = 0.9 + subtleFloat * 0.7;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.2 + Math.sin(t * 0.8) * 0.05);
    }
    if (mouthRef.current) {
      const mouthOpen = speaking ? 0.12 + Math.sin(t * 7) * 0.04 : 0.06;
      mouthRef.current.scale.set(1, mouthOpen, 1);
    }
  });

  return (
    <group>
      <Float speed={2.4} rotationIntensity={0.05} floatIntensity={0.3}>
        <mesh ref={glowRef} position={[0, 0.6, -0.2]}>
          <sphereGeometry args={[1.35, 32, 32]} />
          <meshBasicMaterial color={colorSet.primary} transparent opacity={0.16} />
        </mesh>

        <mesh ref={torsoRef} position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.55, 0.7, 1.6, 32]} />
          <meshStandardMaterial
            color={colorSet.primary}
            metalness={0.15}
            roughness={0.35}
          />
        </mesh>

        <group ref={headRef}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.55, 64, 64]} />
            <meshStandardMaterial
              color="white"
              roughness={0.2}
              metalness={0.1}
              emissive={colorSet.primary}
              emissiveIntensity={0.05}
            />
          </mesh>

          <Eye position={[-0.18, 0.08, 0.46]} radius={0.08} color={colorSet.accent} />
          <Eye position={[0.18, 0.08, 0.46]} radius={0.08} color={colorSet.accent} />

          <mesh ref={mouthRef} position={[0, -0.22, 0.47]}>
            <torusGeometry args={[0.13, 0.04, 16, 32]} />
            <meshStandardMaterial color={colorSet.accent} />
          </mesh>
        </group>

        <mesh position={[0.44, 0.85, 0]} rotation={[0, 0, Math.PI / 4]}>
          <capsuleGeometry args={[0.1, 0.9, 16, 32]} />
          <meshStandardMaterial
            color={colorSet.primary}
            metalness={0.1}
            roughness={0.45}
          />
        </mesh>

        <mesh position={[-0.44, 0.85, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <capsuleGeometry args={[0.1, 0.9, 16, 32]} />
          <meshStandardMaterial
            color={colorSet.primary}
            metalness={0.1}
            roughness={0.45}
          />
        </mesh>

        <mesh position={[0.35, -0.2, 0]}>
          <capsuleGeometry args={[0.12, 0.7, 16, 32]} />
          <meshStandardMaterial color={colorSet.accent} roughness={0.4} />
        </mesh>

        <mesh position={[-0.35, -0.2, 0]}>
          <capsuleGeometry args={[0.12, 0.7, 16, 32]} />
          <meshStandardMaterial color={colorSet.accent} roughness={0.4} />
        </mesh>
      </Float>
    </group>
  );
};

type AvatarCanvasProps = {
  mood: AvatarMood;
  speaking: boolean;
};

export const AvatarCanvas = ({ mood, speaking }: AvatarCanvasProps) => {
  const cameraPosition = useMemo(() => new Vector3(0, 1.5, 3.2), []);

  return (
    <div className="h-full w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <Canvas camera={{ position: cameraPosition.toArray(), fov: 35 }}>
        <ambientLight intensity={0.75} />
        <directionalLight
          position={[3.5, 4, 4]}
          intensity={1.1}
          castShadow
          color="#ffffff"
        />
        <spotLight
          position={[-4, 5, 3]}
          intensity={0.55}
          angle={0.7}
          penumbra={0.4}
          color="#bcd4f7"
        />
        <Suspense fallback={null}>
          <CompanionFigure mood={mood} speaking={speaking} />
          <Environment preset="studio" />
        </Suspense>
        <ContactShadows
          position={[0, -0.1, 0]}
          opacity={0.35}
          width={6}
          height={6}
          blur={2.4}
          far={3.2}
        />
      </Canvas>
    </div>
  );
};
