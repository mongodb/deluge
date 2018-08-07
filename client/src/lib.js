import MainWidget from './components/MainWidget.html';

const FEEDBACK_URL = 'http://deluge.us-east-1.elasticbeanstalk.com/'

function addQueryParameters(url/*: string*/, parameters)/*: string*/ {
    const queryComponents = []

    for (const key of Object.keys(parameters)) {
        const value = parameters[key]
        queryComponents.push(`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`)
    }

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

    sendRating(vote/*: boolean*/, fields)/*: Promise<void>*/ {
        const path = `${this.project}/${this.path}`

        // Report to Segment
        const analyticsData = {'useful': vote}
        for (const fieldName of Object.keys(fields)) {
            analyticsData[fieldName] = fields[fieldName]
        }
        try {
            window.analytics.track('Feedback Submitted', analyticsData)
        } catch (err) {
            console.error(err)
        }

        // Report to Deluge
        return new Promise((resolve, reject) => {
            fields.v = vote
            fields.p = path
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
