/** Action IDs for all actions affecting sinks used as direct mixer outputs. */
export enum OutputActionId {
	OutputLevel = 'level_to_output',

	LRLevelOutput = 'lr_level_output',
	MixLevelOutput = 'mix_level_output',
	FXSendLevelOutput = 'fxsend_level_output',
	MatrixLevelOutput = 'matrix_level_output',
	DCALevelOutput = 'dca_level_output',

	OutputPanBalance = 'pan_to_output',
}
