import { MarkerType, Position } from '@braks/vue-flow';

const data = [
  {
    id: '1',
    label: 'PLAN',
    icon: 'mdi-clipboard-list',
    position: { x: 300, y: 5 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    title: 'Planning Phase',
    description: 'Initial planning and strategy',
    status: 'Not Started',    
    class: 'pdca-purple'
  },
  {
    id: '2',
    label: 'DO',
    icon: 'mdi-play-circle',
    position: { x: 500, y: 125 },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    title: 'Implementation Phase',
    description: 'Execution of the plan',
    status: 'Not Started',
    class: 'pdca-blue'
  },
  {
    id: '3',
    label: 'CHECK',
    icon: 'mdi-check-circle',
    position: { x: 300, y: 250 },
    sourcePosition: Position.Left,
    targetPosition: Position.Right,
    title: 'Check Phase',
    description: 'Review and evaluate results',
    status: 'Not Started',
    class: 'pdca-purple'
  },
  {
    id: '4',
    label: 'ACT',
    icon: 'mdi-rotate-right',
    position: { x: 100, y: 125 },    
    sourcePosition: Position.Top,
    targetPosition: Position.Bottom,
    title: 'Action Phase',
    description: 'Take corrective actions',
    status: 'Not Started',
    class: 'pdca-blue'
  },
  {
    id: '5',
    label: 'Obstakel',
    position: { x: 300, y: 100 },    
    title: 'Obstacle',
    description: 'Identify and address obstacles',
    status: 'Not Started',
    class: 'pdca-obstacle'
  },
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    markerEnd: MarkerType.Arrow,
    animated: true
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    markerEnd: MarkerType.Arrow,
    // animated: true
  },
  {
    id: 'e3-4',
    markerEnd: MarkerType.Arrow,
    source: '3',
    target: '4'
  },
  {
    id: 'e4-1',
    markerEnd: MarkerType.Arrow,
    source: '4',
    target: '1'
  },
];

export default data;