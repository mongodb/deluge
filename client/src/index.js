// @flow

const FEEDBACK_URL = 'http://deluge.us-east-1.elasticbeanstalk.com/'

function addQueryParameters(url: string, parameters: Map<string, string|number|boolean>): string {
    const queryComponents = []

    parameters.forEach((value, key) => {
        queryComponents.push(`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`)
    })

    return url + '?' + queryComponents.join('&')
}

class PendingVote {
    vote: boolean

    constructor(vote: boolean) {
        this.vote = vote
    }
}

type State = PendingVote | 'Voted' | 'NotVoted'

interface Question {
    name: string;
    clear(): void;
    draw(): HTMLElement;
}

class FreeformQuestion {
    name: string
    caption: string
    answer: ?string

    constructor(name: string, caption: string) {
        this.name = name
        this.caption = caption
        this.answer = null
    }

    clear(): void { this.answer = null }

    draw(): HTMLElement {
        const element = document.createElement('div')
        const textForm = document.createElement('textarea')
        textForm.placeholder = this.caption
        element.appendChild(textForm)
        element.oninput = () => { this.answer = textForm.value }

        return element
    }
}

class BinaryQuestion {
    name: string
    promptHtml: string
    answer: ?boolean

    constructor(name: string, promptHtml: string) {
        this.name = name
        this.promptHtml = promptHtml
        this.answer = null
    }

    clear(): void { this.answer = null }

    draw(): HTMLElement {
        const element = document.createElement('div')
        element.innerHTML = this.promptHtml

        const thumbsGutter = document.createElement('div')
        const thumbsUp = document.createElement('span')
        const thumbsDown = document.createElement('span')

        thumbsUp.className = 'switch fa fa-thumbs-up good'
        thumbsUp.onclick = () => {
            this.answer = true
            thumbsUp.className = 'switch fa fa-thumbs-up good selected'
            thumbsDown.className = 'switch fa fa-thumbs-down bad'
        }

        thumbsDown.className = 'switch fa fa-thumbs-down bad'
        thumbsDown.onclick = () => {
            this.answer = false
            thumbsUp.className = 'switch fa fa-thumbs-up good'
            thumbsDown.className = 'switch fa fa-thumbs-down bad selected'
        }

        thumbsGutter.appendChild(thumbsUp)
        thumbsGutter.appendChild(thumbsDown)
        element.appendChild(thumbsGutter)

        return element
    }
}

class RangeQuestion {
    name: string
    promptHtml: string
    answer: ?number
    selectedIndex: ?number

    constructor(name: string, promptHtml: string) {
        this.name = name
        this.promptHtml = promptHtml
        this.answer = null
        this.selectedIndex = null
    }

    clear(): void {
        this.answer = null
        this.selectedIndex = null
    }

    draw(): HTMLElement {
        const element = document.createElement('div')
        const promptElement = document.createElement('div')
        element.appendChild(promptElement)

        promptElement.innerHTML = this.promptHtml

        const starElements = []
        for(let i = 0; i < RangeQuestion.numberOfOptions(); i += 1) {
            const starElement = document.createElement('span')

            starElement.onclick = () => {
                this.answer = i / RangeQuestion.numberOfOptions()
                this.selectedIndex = i
                this.updateView(starElements)
            }

            element.appendChild(starElement)
            starElements.push(starElement)
        }

        this.updateView(starElements)

        return element
    }

    updateView(starElements: HTMLElement[]): void {
        for(let i = 0; i < starElements.length; i += 1) {
            const starElement = starElements[i]

            starElement.className = 'rangestar fa'
            if(this.selectedIndex == null || i > this.selectedIndex) {
                starElement.className += ' fa-star-o'
            } else {
                starElement.className += ' fa-star selected'
            }
        }
    }

    static numberOfOptions() { return 5 }
}

class Deluge {
    project: string
    path: string
    questions: Question[]
    state: State
    storageKey: string

    constructor(project: string, path: string) {
        this.project = project
        this.path = path
        this.questions = []
        this.state = 'NotVoted'

        this.storageKey = `feedback-${project}/${path}`
        const val = localStorage[this.storageKey]
        const ratedDate = val? Date.parse(val).valueOf() : -Infinity;

        // Expire the last rating after 30 days
        if((new Date()).valueOf() < (ratedDate + (1000 * 60 * 60 * 24 * 30))) {
            this.state = 'Voted'
        }
    }

    draw(root: HTMLElement): void {
        if(this.state === 'NotVoted') {
            root.className = ''
            root.innerHTML = '<p>Was this page helpful?</p>' +
                             '<a class="button" id="rate-up">Yes</a>' +
                             '<a class="button" id="rate-down">No</a>'
            root.querySelector('#rate-up').onclick = () => {
                this.state = new PendingVote(true)
                this.draw(root)
            }

            root.querySelector('#rate-down').onclick = () => {
                this.state = new PendingVote(false)
                this.draw(root)
            }

            return
        }

        if(this.state === 'Voted') {
            root.className = ''
            root.innerHTML = '<p>Thank you for your feedback!</p>'
            return
        }

        // Draw the survey
        root.className = 'expanded'

        // Store a copy of state to prevent changes that could result
        // in a type error
        const state = this.state

        root.innerText = ''
        const questionListElement = document.createElement('ul')

        if(state.vote === false) {
            const listElement = document.createElement('li')
            listElement.innerText = 'We\'re sorry! Please help us improve this page.'
            questionListElement.appendChild(listElement)
        }

        this.questions.forEach((question) => {
            question.clear()

            const listElement = document.createElement('li')
            listElement.appendChild(question.draw())
            questionListElement.appendChild(listElement)
        })

        const buttonGroup = document.createElement('div')
        buttonGroup.className = 'button-group'
        questionListElement.appendChild(buttonGroup)

        const cancelButtonElement = document.createElement('button')
        cancelButtonElement.innerText = 'Cancel'
        buttonGroup.appendChild(cancelButtonElement)
        cancelButtonElement.onclick = () => {
            this.state = 'NotVoted'
            this.draw(root)
        }

        const submitButtonElement = document.createElement('button')
        submitButtonElement.innerText = 'Submit'
        submitButtonElement.className = 'primary'
        buttonGroup.appendChild(submitButtonElement)
        submitButtonElement.onclick = () => {
            const answers = new Map()
            this.questions.forEach((question) => {
                if(question.answer != null) {
                    answers.set(question.name, question.answer)
                }
            })

            this.sendRating(state.vote, answers).then(() => {
                const ratedDate = (new Date()).toISOString()
                localStorage.setItem(this.storageKey, ratedDate)

                this.state = 'Voted'
                this.draw(root)
            }).catch(() => {
                console.error('Failed to send feedback')
                this.state = 'NotVoted'
                this.draw(root)
            })
        }

        // Finally attach our new element tree to the DOM. Delay this
        // to prevent unnecessary browser overhead
        root.appendChild(questionListElement)
    }

    askQuestion(name: string, html: string): Deluge {
        const question = new BinaryQuestion(name, html)
        this.questions.push(question)

        return this
    }

    askRangeQuestion(name: string, html: string): Deluge {
        const question = new RangeQuestion(name, html)
        this.questions.push(question)

        return this
    }

    askFreeformQuestion(name: string, caption: string): Deluge {
        const question = new FreeformQuestion(name, caption)
        this.questions.push(question)

        return this
    }

    sendRating(vote: boolean, fields: Map<string, string|number|boolean>): Promise<void> {
        return new Promise((resolve, reject) => {
            fields.set('v', vote)
            fields.set('p', `${this.project}/${this.path}`)
            const url = addQueryParameters(FEEDBACK_URL, fields)

            // Report this rating using an image GET to work around the
            // same-origin policy
            const img = new Image()
            img.onload = () => {

                return resolve()
            }
            img.onerror = () => {
                return reject()
            }
            img.src = url
        })
    }
}

window.Deluge = Deluge
