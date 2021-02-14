# Allen & Heath SQ module

Controls the Allen & Heath SQ.

## Functions:

* Mute Channel, Group, Mix, FX, MuteGroup, DCA, Mtx
* Fader Level
* Panning, Balance Level
* Soft Keys
* Soft Rotary (SQ6/SQ7 - no referring in this version)
* Recall Scene
* Assign channel to Mix, Group, FX send
* Assign group to Mix, FX send, Matrix
* Assign FX return to Mix, Group, FX send
* Assign Mix to Matrix

New in v.1.1.0
* Add listener for MIDI inbound data
* Add function to autoset button status from status of the mute button on SQ
  (first MIDI data from console send all mute status to Companion)

New in v.1.2.0
* Add feedback for all "mute" actions

New in v.1.2.3
* Add presets for "mute" actions and "talkback"

New in v.1.2.5
* Add scene step and current scene display


Created by referring to all controls in the "SQ Midi Protocol Issue 3 - Firmware v. 1.5.0 or later" manual.

Current version: 1.2.5

## How to:

Scene step and current scene display
*	"Scene step" ammit a value between -50 and 50 in order to create forward and rewind scene call.
	"Current scene" display current scene receiving by SQ and show a text like "Scene 13". The value of display
	will be updating on first scene change performed by SQ or Stream Deck. If your console starts with a scene other than 1, 
	set the number in the option of the button, the press the button to setting up your curent scene.
	
Mute feedbacks from console
*	First time launch Companion all buttons status are not will be displaing while you don't move a fader or press a mute on SQ
	(or call scene change from Companion), then SQ will be sends all current mute configurations of all channels to Campanion.

## Presets:

Talkback
*	This macro preset simulate the native function talkback of SQ, but it works with "channel assign to mix" function
	in console routing screen. With this preset you'll be able to talk to one specific AUX channels by pressing a button.
	This preset works with input channel you set up on istance configuration.
	
