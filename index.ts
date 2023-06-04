type IController = () => string

type IMiddleware = {
	after: string[]
	before: string[]
}

type IPath =
	| {
			path: string
			route: IRoute
			middlewares: IMiddleware
			controller?: never
			method?: never
	  }
	| {
			path: string
			middlewares: IMiddleware
			controller: IController
			method: IMethod
			route?: never
	  }

interface IRoute {
	paths: IPath[]
}

type IMethod = 'ALL' | 'POST' | 'GET'

const route: IRoute = {
	paths: [
		{
			path: 'user/:count2',
			middlewares: {
				before: ['user1'],
				after: ['user2'],
			},
			route: {
				paths: [
					{
						path: ':id/balance/:count',
						middlewares: {
							before: ['balance1'],
							after: ['balance2'],
						},
						controller: () => 'controller',
						method: 'GET',
					},
				],
			},
		},
	],
}

const Match = (
	url: string[],
	method: IMethod,
	route: IRoute,
	unmatchedUrl: string[] | null = null,
	middlewares: IMiddleware = { after: [], before: [] },
	params: Record<string, string> = {}
):
	| {
			controller: IController
			middlewares: IMiddleware
			params: Record<string, string>
	  }
	| undefined => {
	if (unmatchedUrl === null) {
		unmatchedUrl = url
	}

	for (const path of route.paths) {
		const pathSliced = path.path.split('/')

		if (pathSliced.length > unmatchedUrl.length) continue

		let match = true

		const unmatchedUrlCopy = structuredClone(unmatchedUrl)

		for (let i = 0; i < pathSliced.length; i++) {
			unmatchedUrlCopy.shift()

			if (
				pathSliced[i] !== unmatchedUrl[i] &&
				!pathSliced[i].startsWith(':')
			) {
				match = false

				break
			}

			if (pathSliced[i].startsWith(':')) {
				params[pathSliced[i].substring(1)] = unmatchedUrl[i]
			}
		}

		if (match) {
			middlewares.before.push(...path.middlewares.before)
			middlewares.after.push(...path.middlewares.after)

			if (
				path.controller &&
				(path.method === method || path.method === 'ALL')
			) {
				// end
				return {
					controller: path.controller,
					middlewares: {
						after: [...middlewares.after].reverse(),
						before: middlewares.before,
					},
					params,
				}
			} else if (!path.controller) {
				// partial
				return Match(
					url,
					method,
					path.route,
					unmatchedUrlCopy,
					middlewares,
					params
				)
			}
		}
	}

	return undefined
}

const url = 'user/3/userId/balance/2'
const method: IMethod = 'GET'

console.log(Match(url.split('/'), method, route))
