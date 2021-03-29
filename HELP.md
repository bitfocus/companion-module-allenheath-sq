# Allen & Heath SQ module

Controls the Allen & Heath SQ.

## Functions:

* Mute Channel, Group, Mix, FX, MuteGroup, DCA, Matrix
* Fader Level
* Panning, Balance Level
* Soft Keys
* Soft Rotary (SQ6/SQ7 - no referring in this version)
* Recall Scene
* Assign channel to Mix, Group, FX send
* Assign group to Mix, FX send, Matrix
* Assign FX return to Mix, Group, FX send
* Assign Mix to Matrix

## Special Functions:

* Current scene display variable
* Current dB Fader Level display variables
* Current Pan level display variables
* Talkback macro
* Scene step increment


New in v.1.1.0
* Add listener for MIDI inbound data
* Add function to auto-set button status from status of the mute button on SQ
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

New in v.1.2.7
* Improved TCP connection
* Fix dB value display

New in v.1.3.0
* Change Mute logics
* Change dB Fader Level logics
* Add Current Scene variable
* Add all dB Fader Level variables
* New presets
* Improved receiving data function
* Cleaning the code

New in v.1.3.1
* Beautify code
* Fix level variables

New in v.1.3.2
* Fix DCA level output

New in v.1.3.3
* Add "Last dB value"
* Add fading option

New in v.1.3.4
* Improve fader level
* Improve pan level
* Improve fading
* Add Pan step increment
* Add Pan level variables

Created by referring to all controls in the "SQ Midi Protocol Issue 3 - Firmware v. 1.5.0 or later" manual.

Last update (d/m/y): 29/03/2021

Current version: 1.3.4

## Configuring:

### New instance
First step after adding SQ instance is to setting it up:

*	Name:				the name you want
*	Target IP:			IP to reach your SQ (needs on the same net)
*	Model:				your SQ model
*	NRPN Fader Law:		same as your MIDI configuration on console !! IMPORTANT !!
*	Default talkback...:	channel number where is connected your talkback microphone

### Soft keys 9 - 16 on SQ5
To configure soft keys 9 - 16 on SQ5 you have to use MixPad application. After initially configuration, all settings will be stored in SQ memory until next configuration or console reset. To avoid deleting the soft key configuration when change scene, set "block" in Scenes Global Filter.

## How to:

### Scene step and current scene display
"Scene step" admits a value between -50 and 50 in order to create forward and rewind scene call.
"Current scene" set the current scene of your console to Companion into a variable (from version 1.3.0) then you'll be able to use it on any button text field. The value of the variable will be updating on first scene change performed by SQ or Companion. If your console starts with a scene other than 1, set the number in the option of the button, the press that button to setting up your starts current scene. To recall the variable on a button, type on button text field <b>$(</b> and Companion show you a list of SQ variables, then select "Scene - Current" (or digit <b>$(SQ:currentScene)</b>).

### Fader step increment
There are two specific values on level drop-down menu (at the top) when you configuring fader level.

### Displaying fader level (dB Level)
From version 1.3.0 fader dB level being a variable. Like the current scene variable, you you'll be able to use it on any button text field and the value will be updating on every level change on the console (or via Companion). To use the variable, start typing <b>$(</b> on button text field and Companion show you a list of SQ variables, then select a level dB you want. If you want to use multi-line text, using <b>\n</b> for a new line.

Example: Showing up a dB fader level (-2) from channel 1 (Mic) to LR

Mic\n$(SQ:level_64_0) dB

the button show on display:

	 Mic
	-2 dB

On same button, if you want, you can attach a Mute function for channel 1.

### Last dB value
This option set at the release action of a Fader Level allows you to return to the last dB value level of that fader.
Example: If the fader level was +2 dB and you want to momentarily set it to -20 dB, set the Press / On action fader level option to "-20 dB", then the Release / Off action of the fader level option to "Last dB value". When the button is pressed the level drops to -20 dB and when the button is released the level returns to +2 dB.

### Fading
This option available on any fader level allow you to reach set dB fader level using fading in/out mode. The speed of the fader route is selectable between 1 and 3 seconds.

### Pan display getVariables
When configuring a button with one of the Pan functions appear an only read option that shows name of variable to use on button text to show up value of Pan/Balance. After select option for input and destination you need to press configuring button once to refresh variable value before use it.

## Presets:

### Talkback
This macro preset simulate the native function talkback of SQ, but it works with "channel assign to mix" function in console routing screen. With this preset you'll be able to talk to one specific AUX channels by pressing a button. This preset works with talkback input channel you set up on instance configuration. Initially, you have to remove the talkback input channel from mix assign on the console.
