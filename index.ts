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

const url = 'user/id/balance'
const method: IMethod = 'ALL'

const route: IRoute = {
	paths: [
		{
			path: 'user',
			middlewares: {
				before: ['user1'],
				after: ['user2'],
			},
			route: {
				paths: [
					{
						path: ':id/balance',
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
	middlewares: IMiddleware = { after: [], before: [] }
): { controller: IController; middlewares: IMiddleware } | undefined => {
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
		}

		if (match) {
			middlewares.before.push(...path.middlewares.before)
			middlewares.after.push(...path.middlewares.after)

			if (path.controller) {
				// end
				return {
					controller: path.controller,
					middlewares: {
						after: [...middlewares.after].reverse(),
						before: middlewares.before,
					},
				}
			} else if (!path.controller) {
				// partial
				return Match(
					url,
					method,
					path.route,
					unmatchedUrlCopy,
					middlewares
				)
			}
		}
	}

	return undefined
}

console.log(Match(url.split('/'), method, route))
