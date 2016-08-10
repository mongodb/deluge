[![Build Status](https://travis-ci.org/i80and/deluge.svg?branch=master)](https://travis-ci.org/i80and/deluge)

Deluge
======

A simple web feedback server.

Javascript Reference      
==================== 

* Deluge(project: string, path: string): void
  * askQuestion(name: string, html: string): Deluge
    * Asks a yes/no question using the given HTML used as a prompt.  Returns ``this``.
  * askRangeQuestion(name: string, html: string): Deluge
      * Asks a question with a 5-star scale using the given HTML used as a prompt.  Returns ``this``.
  * askFreeformQuestion(name: string, caption: string): Deluge
    * Asks a freeform textual question. The caption text is used as a placeholder for the form. Returns ``this``.
  * draw(root: HTMLElement): void
    * Draw the final widget into the given HTML element.
