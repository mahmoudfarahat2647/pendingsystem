interface CntrRdgAlertIconProps {
	color: string;
}

export const CntrRdgAlertIcon = ({ color }: CntrRdgAlertIconProps) => (
	<svg
		fill="none"
		viewBox="0 0 32 32"
		xmlns="http://www.w3.org/2000/svg"
		width="32"
		height="32"
		aria-hidden="true"
	>
		<g>
			<g transform="translate(15,18.75)">
				<animateTransform
					repeatCount="indefinite"
					type="translate"
					attributeName="transform"
					dur="3s"
					begin="0s"
					calcMode="spline"
					values="15 18.75; 17 18.75; 15 18.75; 17 18.75; 15 18.75; 17 18.75; 15 18.75; 16 18.75; 16 18.75; 15 18.75; 17 18.75; 15 18.75; 17 18.75; 15 18.75; 17 18.75; 15 18.75; 16 18.75; 16 18.75"
					keyTimes="0; 0.033; 0.067; 0.1; 0.133; 0.167; 0.2; 0.211; 0.478; 0.511; 0.544; 0.578; 0.611; 0.644; 0.678; 0.711; 0.722; 1"
					keySplines="0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
					fill="freeze"
				/>
				<g transform="scale(1,1) translate(0,-2.75)">
					<g>
						<path
							strokeLinejoin="round"
							strokeLinecap="round"
							strokeWidth="2"
							strokeOpacity="1"
							stroke={color}
							d="M-11.692,7.02L-1.964,-9.383L-1.964,-9.383C-1.759,-9.724,-1.471,-10.006,-1.127,-10.202C-0.783,-10.398,-0.395,-10.5,0,-10.5C0.395,-10.5,0.783,-10.398,1.127,-10.202C1.471,-10.006,1.759,-9.724,1.964,-9.383L11.692,7.02C11.893,7.371,11.999,7.769,12,8.174C12.001,8.579,11.898,8.977,11.699,9.329C11.5,9.681,11.214,9.975,10.868,10.18C10.522,10.385,10.129,10.496,9.728,10.5L-9.728,10.5C-10.129,10.496,-10.522,10.385,-10.868,10.18C-11.214,9.975,-11.5,9.681,-11.699,9.329C-11.898,8.977,-12.001,8.579,-12,8.174C-11.999,7.769,-11.893,7.371,-11.692,7.02Z"
						/>
					</g>
				</g>
			</g>
		</g>
		<g>
			<g transform="translate(15.938,11.615)">
				<g transform="rotate(30)">
					<animateTransform
						repeatCount="indefinite"
						type="rotate"
						attributeName="transform"
						dur="3s"
						begin="0s"
						calcMode="spline"
						values="30; -30; 30; -30; 30; -30; 30; 0; 0; 30; -30; 30; -30; 30; -30; 30; 0; 0"
						keyTimes="0; 0.033; 0.067; 0.1; 0.133; 0.167; 0.2; 0.211; 0.478; 0.511; 0.544; 0.578; 0.611; 0.644; 0.678; 0.711; 0.722; 1"
						keySplines="0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
						fill="freeze"
					/>
					<g transform="scale(1,1) translate(0,3.363)">
						<g>
							<path
								strokeLinejoin="round"
								strokeLinecap="round"
								strokeWidth="2"
								strokeOpacity="1"
								stroke={color}
								d="M0,3L0,-3"
							/>
						</g>
					</g>
				</g>
			</g>
		</g>
		<g>
			<g transform="translate(15.938,11.615)">
				<g transform="rotate(30)">
					<animateTransform
						repeatCount="indefinite"
						type="rotate"
						attributeName="transform"
						dur="3s"
						begin="0s"
						calcMode="spline"
						values="30; -30; 30; -30; 30; -30; 30; 0; 0; 30; -30; 30; -30; 30; -30; 30; 0; 0"
						keyTimes="0; 0.033; 0.067; 0.1; 0.133; 0.167; 0.2; 0.211; 0.478; 0.511; 0.544; 0.578; 0.611; 0.644; 0.678; 0.711; 0.722; 1"
						keySplines="0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
						fill="freeze"
					/>
					<g transform="scale(1,1) translate(0,3.363)">
						<g transform="matrix(1,0,0,1,0,6.7)">
							<g>
								<ellipse
									ry="1"
									rx="1"
									cy="0"
									cx="0"
									fill={color}
									fillOpacity="1"
								/>
							</g>
						</g>
					</g>
				</g>
			</g>
		</g>
	</svg>
);
