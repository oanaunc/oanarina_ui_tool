import type {DesignNode} from '../../src/model';
export function textPathRunsFixture(n:DesignNode):DesignNode{return {...n,fontFeatures:{liga:0},textRuns:[{start:0,end:4,fontWeight:700,fill:'#0000ff',fontSize:n.fontSize*1.5}]};}
