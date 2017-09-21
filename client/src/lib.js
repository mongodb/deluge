import MainWidget from './components/MainWidget.html';

const FEEDBACK_URL = 'http://deluge.us-east-1.elasticbeanstalk.com/'

function addQueryParameters(url/*: string*/, parameters/*: Map<string, string|boolean>*/)/*: string*/ {
    const queryComponents = []

    parameters.forEach((value, key) => {
        queryComponents.push(`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`)
    })

    return url + '?' + queryComponents.join('&')
}

export class Deluge {
    constructor(project/*: string*/, path/*: string*/, root/*: HTMLElement*/) {
        this.project = project
        this.path = path

        this.app = new MainWidget({
            target: root,
            data: {
                state: 'Initial',
                project: project,
                pagename: path,
            }
        })

        this.app.on('submit', event => {
            this.sendRating(event.vote, event.fields).then(() => {
                if (event.vote) {
                    this.app.set({state: 'Voted-Up'})
                } else {
                    this.app.set({state: 'Voted-Down'})
                }
            }).catch((err) => {
                console.error('Error submitting feedback')
            })
        })
    }

    askQuestion(name/*: string*/, html/*: string*/)/*: Deluge*/ {
        this.app.addQuestion('binary', name, html)
        return this
    }

    askFreeformQuestion(name/*: string*/, caption/*: string*/)/*: Deluge*/ {
        this.app.addQuestion('freeform', name, caption)
        return this
    }

    sendRating(vote/*: boolean*/, fields/*: Map<string, string|boolean>*/)/*: Promise<void>*/ {
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

    open() {
        this.app.open()
    }
}
