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

New in v.1.2.6
* Improved code
* Add fader step increment
* Add fader level dB get


Created by referring to all controls in the "SQ Midi Protocol Issue 3 - Firmware v. 1.5.0 or later" manual.

Current version: 1.2.6

## Configuring:

### New instance
First step after adding SQ instance is to setting it up:

*	Name: 					the name you want
*	Target IP:				IP to reach your SQ (needs on the same net)
*	Model:					your SQ model
*	NRPN Fader Law:			same as your MIDI configuration on console !! IMPORTANT !!
*	Default talkback...:	channel number where is connected your talkback microphone

### Soft keys 9 - 16 on SQ5
To configure soft keys 9 - 16 on SQ5 you have to use MixPad application. After initially configuration, all settings 
will be stored in SQ memory until next configuration or console reset. To avoid deleting the soft key configuration when change
scene, set "block" in Scenes Global Filter.

## How to:

### Scene step and current scene display
*	"Scene step" ammits a value between -50 and 50 in order to create forward and rewind scene call.
	"Current scene" display current scene receiving by SQ and show a text like "Scene 13". The value of display
	will be updating on first scene change performed by SQ or Stream Deck. If your console starts with a scene other than 1, 
	set the number in the option of the button, the press that button to setting up your starts curent scene.
	
### Fader step increment
*	There are two specifc values on level dropdown menu (at the top) when you configuring fader level.

### Displaing fader level (dB Level)
*	This function accept only 1 (one) button instance for any combination of the faders. Function shows dB level of the fader 
	in real time. The button name can be any string and the function adds the level value to it. Example, if you set "Mic" the
	function changes it to "Mic -4dB".

## Presets:

### Talkback
*	This macro preset simulate the native function talkback of SQ, but it works with "channel assign to mix" function
	in console routing screen. With this preset you'll be able to talk to one specific AUX channels by pressing a button.
	This preset works with talkback input channel you set up on istance configuration. Initially, you have to remove the 
	talback input channel from mix assign on the console.
	
