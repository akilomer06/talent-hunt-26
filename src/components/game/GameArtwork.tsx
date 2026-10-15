import { Code2, Layout, Brain, Cpu, Gamepad2, Mic2, ShieldAlert, Sparkles, Camera, Search, Shirt, PlayCircle, Crosshair, Trophy, Flame, Gavel, type LucideIcon } from 'lucide-react';

const icons: Record<string, LucideIcon> = { Code2, Layout, Brain, Cpu, Gamepad2, Mic2, ShieldAlert, Sparkles, Camera, Search, Shirt, PlayCircle, Crosshair, Trophy, Flame, Gavel };
const scenes: Record<string, string> = {
  'code-break': 'terminal', 'code-canvas': 'canvas', 'neural-nexus': 'neural', 'binary-battle': 'binary',
  'game-craft': 'platform', 'tech-talks': 'wave', 'cyber-breach': 'radar', 'prompt-pop': 'spark',
  'shutter-verse': 'camera', 'clue-code': 'radar', 'trashion': 'fashion', 'the-voice-over': 'wave',
  bgmi: 'target', fifa: 'football', valorant: 'target', 'bid-wars': 'auction',
};

export function GameArtwork({ id, iconName }: { id: string; iconName: string }) {
  const scene = scenes[id] ?? 'spark';
  const Icon = icons[iconName] ?? Gamepad2;
  return <div className={`gm-art gm-art-${scene}`} aria-hidden="true">
    <svg viewBox="0 0 320 190" className="gm-art-scene">
      <path className="gm-scene-grid" d="M0 38H320M0 76H320M0 114H320M0 152H320M40 0V190M80 0V190M120 0V190M160 0V190M200 0V190M240 0V190M280 0V190" />
      <g className="gm-scene-ring"><circle cx="160" cy="95" r="65"/><circle cx="160" cy="95" r="49" strokeDasharray="12 16"/><path d="M160 18V35M160 155V172M83 95H100M220 95H237"/></g>
      <g className="gm-scene-nodes">{([{x:55,y:45},{x:265,y:38},{x:42,y:145},{x:272,y:150},{x:160,y:22},{x:160,y:169}]).map(({x,y},i)=><g key={i}><path d={`M${x} ${y}L160 95`}/><rect x={x-4} y={y-4} width="8" height="8"/></g>)}</g>
      <g className="gm-scene-bars">{Array.from({length:13},(_,i)=><rect key={i} x={45+i*18} y={60+(i%3)*8} width="8" height={70-(i%3)*16}/>)}</g>
      <g className="gm-scene-platform"><path d="M20 145H90V160H20ZM122 123H192V138H122ZM225 100H300V115H225Z"/><rect className="gm-runner" x="40" y="120" width="16" height="20"/><path className="gm-coin" d="M155 86l8 8-8 8-8-8z"/></g>
      <g className="gm-scene-code"><text x="25" y="45">{'>'} RUN_ARENA.exe</text><text x="25" y="72">{'{ build. play. win. }'}</text><text x="25" y="153">0101 1100 1010 0011</text><path className="gm-code-line" d="M25 165H295"/></g>
      <g className="gm-scene-ball"><path d="M15 20H305V170H15ZM160 20V170"/><circle cx="160" cy="95" r="36"/><circle className="gm-football" cx="90" cy="125" r="13"/></g>
      <path className="gm-scan" d="M5 0H315"/>
      <g className="gm-particles">{Array.from({length:8},(_,i)=><path key={i} d={`M${25+i*38} ${28+(i%3)*60}h8v8h-8z`}/>)}</g>
    </svg>
    <Icon className="gm-art-icon" strokeWidth={1.3}/>
    <span className="gm-art-label">{scene === 'terminal' ? '> compiling…' : scene === 'wave' ? 'LIVE SIGNAL' : scene === 'radar' ? 'SCANNING…' : scene === 'football' ? 'KICK OFF' : 'ARENA ONLINE'}</span>
  </div>;
}

export function ArcadeBackdrop() {
  return <svg className="gm-arcade-backdrop" viewBox="0 0 1440 780" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g className="gm-starfield">{Array.from({length:42},(_,i)=><path key={i} d={`M${(i*137)%1440} ${(i*97)%640}h3v3h-3z`}/>)}</g>
    <g className="gm-invaders">{Array.from({length:12},(_,i)=><path key={i} transform={`translate(${90+(i%6)*235} ${80+Math.floor(i/6)*140}) scale(2)`} d="M4 0h4v4h4V0h4v4h4v4h4v12h-4v-4H4v4H0V8h4V4h4V0Zm0 8v4h4V8Zm12 0v4h4V8ZM4 20h4v4H4Zm12 0h4v4h-4Z"/>)}</g>
    <g className="gm-space-ship"><path d="M700 690h12v-18h16v18h12v12h18v18h-76v-18h18Z"/><path className="gm-thruster" d="M710 726h20l-10 30Z"/></g>
    <path className="gm-laser" d="M720 650v-55"/>
    <path className="gm-horizon" d="M0 745H1440M0 775H1440M180 780L490 580M450 780L605 580M720 780V580M990 780L835 580M1260 780L950 580"/>
  </svg>;
}
